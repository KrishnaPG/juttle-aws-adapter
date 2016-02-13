'use strict';
var jsdiff = require('diff');
var _ = require('underscore');
var traverse = require('traverse');
var JuttleMoment = require('juttle/lib/moment/juttle-moment');

class AWSMon {

    constructor(options) {
        this._AWS = options.AWS;
        this._logger = options.logger;

        // Set in poll
        this._now = undefined;

        // Each plugin manages a set of items, as a hash id -> object
        // describing the item.
        this._last_items = {};
    }

    //
    // PUBLIC METHODS
    //

    // Must be overridden
    product() {
        throw new Error('must be overridden');
    }

    // Must be overridden
    item_name() {
        throw new Error('must be overridden');
    }

    poll(now) {
        this._now = now;

        return this.get_items()
        .then((items) => {
            let tidy_items = _.map(items, (item) => {
                this.tidy_point(item);
                return item;
            });

            let changes = this.changes(this.item_name(), items, this._last_items);

            this._last_items = items;

            return tidy_items.concat(changes);
        }).error((e) => {
            this._logger.error(`Could not fetch information for ${this.product()}: ${e}`);
            throw e;
        });

    }

    // Should be overridden by derived classes. Return a promise that
    // resolves with the current set of items as a hash item id ->
    // object.
    get_items() {
        throw new Error('must be overridden');
    }

    //
    // PROTECTED METHODS
    //

    create_event(event_type, item, msg) {
        msg = msg || '';

        var event = {
            time: this._now,
            product: this.product(),
            event_type: event_type,
            item: item,
            msg: msg
        };

        return event;
    }

    // Given a new and current hash mapping item id -> item, return
    // events when items are added, removed, or changed.
    changes(itemtype, cur_items, old_items) {
        var events = [];

        // Never any changes when the set of old items is empty
        if (_.size(old_items) === 0) {
            return [];
        }

        var cur_ids = _.keys(cur_items);
        var old_ids = _.keys(old_items);

        var added = _.difference(cur_ids, old_ids);

        for(let id of added) {
            events.push(this.create_event(itemtype + ' Added', id));
        }

        var removed = _.difference(old_ids, cur_ids);

        for(let id of removed) {
            events.push(this.create_event(itemtype + ' Removed', id));
        }

        var existing = _.intersection(cur_ids, old_ids);

        for(let id of existing) {
            let diffs = jsdiff.diffJson(old_items[id],
                                        cur_items[id]);

            let changed = (diffs.length > 1 ||
                           _.has(diffs[0], 'added') ||
                           _.has(diffs[0], 'removed'));

            if (changed) {
                // XXX/mstemm add details on what changed
                events.push(this.create_event(itemtype + ' Changed',
                                              id,
                                              ''));
            }
        }

        this._logger.debug(itemtype + ': ' + added.length + ' added, ' + removed.length + ' removed, ' + existing.length + ' existing');
        return events;
    }

    // Take the given raw point which is the result of one of the
    // Amazon API calls and tidy it up for use by Juttle. This
    // includes:
    //  - Adding the product name as a property "product".
    //  - Adding the time as a property "time".
    //  - Converting all Dates in the object (including nested Dates) to JuttleMoments.
    // This does not return any value. It modifies the point in-place.

    tidy_point(point) {
        traverse(point).forEach(function(node) {
            if (node instanceof Date) {
                this.update(new JuttleMoment(node), true);
            }
        });
        point.product = this.product();
        point.time = this._now;
    }
}

module.exports = AWSMon;
