
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }
    class HtmlTag {
        constructor() {
            this.e = this.n = null;
        }
        c(html) {
            this.h(html);
        }
        m(html, target, anchor = null) {
            if (!this.e) {
                this.e = element(target.nodeName);
                this.t = target;
                this.c(html);
            }
            this.i(anchor);
        }
        h(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(this.t, this.n[i], anchor);
            }
        }
        p(html) {
            this.d();
            this.h(html);
            this.i(this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.40.3' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* ..\src\themes\Default.svelte generated by Svelte v3.40.3 */

    const file$3 = "..\\src\\themes\\Default.svelte";

    function create_fragment$a(ctx) {
    	let main;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (default_slot) default_slot.c();
    			attr_dev(main, "class", "svelte-5r4m6");
    			add_location(main, file$3, 37, 0, 843);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);

    			if (default_slot) {
    				default_slot.m(main, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[0],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[0])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[0], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Default', slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Default> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class Default extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Default",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    var themes = /*#__PURE__*/Object.freeze({
        __proto__: null,
        Default: Default
    });

    var en = {
    	'previous': 'Previous',
    	'next': 'Next',
    	'search': 'Search:',
    	'loading': 'Loading',
    	'no_data_available': 'No data available',
    	'results_limit_pre': 'Show',
    	'results_limit_post': 'entries',
    	'results_count': (vars) => `Showing ${vars.start} to ${vars.end} of ${vars.total} entries`
    };

    var nl = {
    	'previous': 'Vorige',
    	'next': 'Volgende',
    	'search': 'Zoek:',
    	'loading': 'Laden',
    	'no_data_available': 'Geen data beschikbaar.',
    	'results_limit_pre': 'Toon',
    	'results_limit_post': 'resultaten',
    	'results_count': (vars) => `Resultaten ${vars.start} t/m ${vars.end} van ${vars.total} totaal`
    };

    var languages = /*#__PURE__*/Object.freeze({
        __proto__: null,
        en: en,
        nl: nl
    });

    /* ..\src\Datatable.svelte generated by Svelte v3.40.3 */

    const { Object: Object_1 } = globals;
    const file$2 = "..\\src\\Datatable.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	child_ctx[57] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[58] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[61] = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[58] = list[i];
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[58] = list[i];
    	return child_ctx;
    }

    function get_each_context_5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[68] = list[i];
    	return child_ctx;
    }

    // (315:3) {#if limits && totalRows}
    function create_if_block_9(ctx) {
    	let div;
    	let t0_value = /*_*/ ctx[17]('results_limit_pre') + "";
    	let t0;
    	let t1;
    	let select;
    	let t2;
    	let t3_value = /*_*/ ctx[17]('results_limit_post') + "";
    	let t3;
    	let mounted;
    	let dispose;
    	let each_value_5 = /*limits*/ ctx[3];
    	validate_each_argument(each_value_5);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_5.length; i += 1) {
    		each_blocks[i] = create_each_block_5(get_each_context_5(ctx, each_value_5, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			t3 = text(t3_value);
    			attr_dev(select, "class", "svelte-41wulr");
    			add_location(select, file$2, 317, 5, 6218);
    			attr_dev(div, "class", "limit svelte-41wulr");
    			add_location(div, file$2, 315, 4, 6161);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			append_dev(div, t2);
    			append_dev(div, t3);

    			if (!mounted) {
    				dispose = listen_dev(select, "change", /*limitChange*/ ctx[15], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*limits, limit*/ 24) {
    				each_value_5 = /*limits*/ ctx[3];
    				validate_each_argument(each_value_5);
    				let i;

    				for (i = 0; i < each_value_5.length; i += 1) {
    					const child_ctx = get_each_context_5(ctx, each_value_5, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_5.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(315:3) {#if limits && totalRows}",
    		ctx
    	});

    	return block;
    }

    // (319:6) {#each limits as potentialLimit}
    function create_each_block_5(ctx) {
    	let option;
    	let t_value = /*potentialLimit*/ ctx[68] + "";
    	let t;
    	let option_selected_value;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.selected = option_selected_value = /*potentialLimit*/ ctx[68] == /*limit*/ ctx[4];
    			option.__value = option_value_value = /*potentialLimit*/ ctx[68];
    			option.value = option.__value;
    			add_location(option, file$2, 319, 7, 6299);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*limits*/ 8 && t_value !== (t_value = /*potentialLimit*/ ctx[68] + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*limits, limit*/ 24 && option_selected_value !== (option_selected_value = /*potentialLimit*/ ctx[68] == /*limit*/ ctx[4])) {
    				prop_dev(option, "selected", option_selected_value);
    			}

    			if (dirty[0] & /*limits*/ 8 && option_value_value !== (option_value_value = /*potentialLimit*/ ctx[68])) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_5.name,
    		type: "each",
    		source: "(319:6) {#each limits as potentialLimit}",
    		ctx
    	});

    	return block;
    }

    // (326:3) {#if searchEnabled}
    function create_if_block_8(ctx) {
    	let div;
    	let t0_value = /*_*/ ctx[17]('search') + "";
    	let t0;
    	let t1;
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			input = element("input");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "svelte-41wulr");
    			add_location(input, file$2, 327, 19, 6523);
    			attr_dev(div, "class", "search svelte-41wulr");
    			add_location(div, file$2, 326, 4, 6482);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, input);

    			if (!mounted) {
    				dispose = listen_dev(input, "keyup", /*searchKeyup*/ ctx[14], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(326:3) {#if searchEnabled}",
    		ctx
    	});

    	return block;
    }

    // (337:7) {#if column.sortable}
    function create_if_block_5(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*sort*/ ctx[10]?.column.key !== /*column*/ ctx[58].key) return create_if_block_6;
    		if (/*sort*/ ctx[10].order === 'desc') return create_if_block_7;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(337:7) {#if column.sortable}",
    		ctx
    	});

    	return block;
    }

    // (343:9) {:else}
    function create_else_block_1(ctx) {
    	let span;
    	let i;

    	const block = {
    		c: function create() {
    			span = element("span");
    			i = element("i");
    			attr_dev(i, "class", "chevron chevron-top svelte-41wulr");
    			add_location(i, file$2, 343, 29, 7114);
    			attr_dev(span, "class", "icon svelte-41wulr");
    			add_location(span, file$2, 343, 10, 7095);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, i);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(343:9) {:else}",
    		ctx
    	});

    	return block;
    }

    // (341:9) {#if sort.order === 'desc'}
    function create_if_block_7(ctx) {
    	let span;
    	let i;

    	const block = {
    		c: function create() {
    			span = element("span");
    			i = element("i");
    			attr_dev(i, "class", "chevron chevron-bottom svelte-41wulr");
    			add_location(i, file$2, 341, 29, 7020);
    			attr_dev(span, "class", "icon svelte-41wulr");
    			add_location(span, file$2, 341, 10, 7001);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, i);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(341:9) {#if sort.order === 'desc'}",
    		ctx
    	});

    	return block;
    }

    // (338:8) {#if sort?.column.key !== column.key}
    function create_if_block_6(ctx) {
    	let span;
    	let i;

    	const block = {
    		c: function create() {
    			span = element("span");
    			i = element("i");
    			attr_dev(i, "class", "chevron chevron-bottom svelte-41wulr");
    			add_location(i, file$2, 338, 37, 6889);
    			attr_dev(span, "class", "icon inactive svelte-41wulr");
    			add_location(span, file$2, 338, 9, 6861);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, i);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(338:8) {#if sort?.column.key !== column.key}",
    		ctx
    	});

    	return block;
    }

    // (334:5) {#each columns as column}
    function create_each_block_4(ctx) {
    	let th;
    	let t0_value = /*column*/ ctx[58].label + "";
    	let t0;
    	let t1;
    	let t2;
    	let th_class_value;
    	let mounted;
    	let dispose;
    	let if_block = /*column*/ ctx[58].sortable && create_if_block_5(ctx);

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[47](/*column*/ ctx[58], ...args);
    	}

    	const block = {
    		c: function create() {
    			th = element("th");
    			t0 = text(t0_value);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			attr_dev(th, "class", th_class_value = "" + (null_to_empty(/*column*/ ctx[58].sortable ? 'sortable' : '') + " svelte-41wulr"));
    			add_location(th, file$2, 334, 6, 6663);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, th, anchor);
    			append_dev(th, t0);
    			append_dev(th, t1);
    			if (if_block) if_block.m(th, null);
    			append_dev(th, t2);

    			if (!mounted) {
    				dispose = listen_dev(th, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*columns*/ 2 && t0_value !== (t0_value = /*column*/ ctx[58].label + "")) set_data_dev(t0, t0_value);

    			if (/*column*/ ctx[58].sortable) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_5(ctx);
    					if_block.c();
    					if_block.m(th, t2);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty[0] & /*columns*/ 2 && th_class_value !== (th_class_value = "" + (null_to_empty(/*column*/ ctx[58].sortable ? 'sortable' : '') + " svelte-41wulr"))) {
    				attr_dev(th, "class", th_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(th);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4.name,
    		type: "each",
    		source: "(334:5) {#each columns as column}",
    		ctx
    	});

    	return block;
    }

    // (353:4) {#if !rows || rows.length === 0}
    function create_if_block_4(ctx) {
    	let tr;
    	let td;
    	let t_value = /*_*/ ctx[17]('no_data_available') + "";
    	let t;
    	let td_colspan_value;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td = element("td");
    			t = text(t_value);
    			attr_dev(td, "colspan", td_colspan_value = /*columns*/ ctx[1].length || 1);
    			set_style(td, "text-align", "center");
    			add_location(td, file$2, 354, 6, 7323);
    			add_location(tr, file$2, 353, 5, 7311);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td);
    			append_dev(td, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*columns*/ 2 && td_colspan_value !== (td_colspan_value = /*columns*/ ctx[1].length || 1)) {
    				attr_dev(td, "colspan", td_colspan_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(353:4) {#if !rows || rows.length === 0}",
    		ctx
    	});

    	return block;
    }

    // (364:8) {:else}
    function create_else_block(ctx) {
    	let t_value = (/*row*/ ctx[61][/*column*/ ctx[58].key] ?? '') + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*rows, columns*/ 3 && t_value !== (t_value = (/*row*/ ctx[61][/*column*/ ctx[58].key] ?? '') + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(364:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (362:8) {#if row[column.key]?.innerHTML}
    function create_if_block_3(ctx) {
    	let html_tag;
    	let raw_value = /*row*/ ctx[61][/*column*/ ctx[58].key].innerHTML + "";
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_tag = new HtmlTag();
    			html_anchor = empty();
    			html_tag.a = html_anchor;
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*rows, columns*/ 3 && raw_value !== (raw_value = /*row*/ ctx[61][/*column*/ ctx[58].key].innerHTML + "")) html_tag.p(raw_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(362:8) {#if row[column.key]?.innerHTML}",
    		ctx
    	});

    	return block;
    }

    // (360:6) {#each columns as column}
    function create_each_block_3(ctx) {
    	let td;
    	let mounted;
    	let dispose;

    	function select_block_type_1(ctx, dirty) {
    		if (/*row*/ ctx[61][/*column*/ ctx[58].key]?.innerHTML) return create_if_block_3;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	function mouseup_handler(...args) {
    		return /*mouseup_handler*/ ctx[48](/*row*/ ctx[61], /*column*/ ctx[58], ...args);
    	}

    	const block = {
    		c: function create() {
    			td = element("td");
    			if_block.c();
    			add_location(td, file$2, 360, 7, 7551);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			if_block.m(td, null);

    			if (!mounted) {
    				dispose = listen_dev(td, "mouseup", mouseup_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(td, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    			if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(360:6) {#each columns as column}",
    		ctx
    	});

    	return block;
    }

    // (358:4) {#each rows as row}
    function create_each_block_2(ctx) {
    	let tr;
    	let t;
    	let mounted;
    	let dispose;
    	let each_value_3 = /*columns*/ ctx[1];
    	validate_each_argument(each_value_3);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	function mouseup_handler_1(...args) {
    		return /*mouseup_handler_1*/ ctx[49](/*row*/ ctx[61], ...args);
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			add_location(tr, file$2, 358, 5, 7470);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append_dev(tr, t);

    			if (!mounted) {
    				dispose = listen_dev(tr, "mouseup", mouseup_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*cellClick, rows, columns*/ 4099) {
    				each_value_3 = /*columns*/ ctx[1];
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tr, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_3.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(358:4) {#each rows as row}",
    		ctx
    	});

    	return block;
    }

    // (374:5) {#each columns as column}
    function create_each_block_1(ctx) {
    	let th;
    	let t_value = /*column*/ ctx[58].label + "";
    	let t;

    	const block = {
    		c: function create() {
    			th = element("th");
    			t = text(t_value);
    			add_location(th, file$2, 374, 6, 7882);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, th, anchor);
    			append_dev(th, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*columns*/ 2 && t_value !== (t_value = /*column*/ ctx[58].label + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(th);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(374:5) {#each columns as column}",
    		ctx
    	});

    	return block;
    }

    // (380:3) {#if totalRows}
    function create_if_block(ctx) {
    	let t;
    	let if_block1_anchor;
    	let if_block0 = /*limit*/ ctx[4] && create_if_block_2(ctx);
    	let if_block1 = /*totalPages*/ ctx[9] > 1 && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*limit*/ ctx[4]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(t.parentNode, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*totalPages*/ ctx[9] > 1) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(380:3) {#if totalRows}",
    		ctx
    	});

    	return block;
    }

    // (381:4) {#if limit}
    function create_if_block_2(ctx) {
    	let div;

    	let t_value = /*_*/ ctx[17]('results_count', {
    		start: (/*page*/ ctx[6] - 1) * /*limit*/ ctx[4] + 1,
    		end: (/*page*/ ctx[6] - 1) * /*limit*/ ctx[4] + /*rows*/ ctx[0].length,
    		total: /*totalRows*/ ctx[2]
    	}) + "";

    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "count svelte-41wulr");
    			add_location(div, file$2, 381, 5, 8001);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*page, limit, rows, totalRows*/ 85 && t_value !== (t_value = /*_*/ ctx[17]('results_count', {
    				start: (/*page*/ ctx[6] - 1) * /*limit*/ ctx[4] + 1,
    				end: (/*page*/ ctx[6] - 1) * /*limit*/ ctx[4] + /*rows*/ ctx[0].length,
    				total: /*totalRows*/ ctx[2]
    			}) + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(381:4) {#if limit}",
    		ctx
    	});

    	return block;
    }

    // (390:4) {#if totalPages > 1}
    function create_if_block_1(ctx) {
    	let div;
    	let a0;
    	let t0_value = /*_*/ ctx[17]('previous') + "";
    	let t0;
    	let a0_class_value;
    	let t1;
    	let t2;
    	let a1;
    	let t3_value = /*_*/ ctx[17]('next') + "";
    	let t3;
    	let a1_class_value;
    	let mounted;
    	let dispose;
    	let each_value = { length: /*totalPages*/ ctx[9] };
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			a0 = element("a");
    			t0 = text(t0_value);
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			a1 = element("a");
    			t3 = text(t3_value);
    			attr_dev(a0, "class", a0_class_value = "previous " + (/*page*/ ctx[6] > 1 ? 'enabled' : 'disabled') + " svelte-41wulr");
    			add_location(a0, file$2, 391, 6, 8260);

    			attr_dev(a1, "class", a1_class_value = "next " + (/*page*/ ctx[6] < /*totalPages*/ ctx[9]
    			? 'enabled'
    			: 'disabled') + " svelte-41wulr");

    			add_location(a1, file$2, 395, 6, 8565);
    			attr_dev(div, "class", "pagination svelte-41wulr");
    			add_location(div, file$2, 390, 5, 8228);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, a0);
    			append_dev(a0, t0);
    			append_dev(div, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t2);
    			append_dev(div, a1);
    			append_dev(a1, t3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(a0, "click", /*click_handler_1*/ ctx[50], false, false, false),
    					listen_dev(a1, "click", /*click_handler_3*/ ctx[52], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*page*/ 64 && a0_class_value !== (a0_class_value = "previous " + (/*page*/ ctx[6] > 1 ? 'enabled' : 'disabled') + " svelte-41wulr")) {
    				attr_dev(a0, "class", a0_class_value);
    			}

    			if (dirty[0] & /*page, pageChange, totalPages*/ 66112) {
    				each_value = { length: /*totalPages*/ ctx[9] };
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t2);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty[0] & /*page, totalPages*/ 576 && a1_class_value !== (a1_class_value = "next " + (/*page*/ ctx[6] < /*totalPages*/ ctx[9]
    			? 'enabled'
    			: 'disabled') + " svelte-41wulr")) {
    				attr_dev(a1, "class", a1_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(390:4) {#if totalPages > 1}",
    		ctx
    	});

    	return block;
    }

    // (393:6) {#each {length: totalPages} as _, i}
    function create_each_block(ctx) {
    	let a;
    	let t_value = /*i*/ ctx[57] + 1 + "";
    	let t;
    	let a_class_value;
    	let mounted;
    	let dispose;

    	function click_handler_2(...args) {
    		return /*click_handler_2*/ ctx[51](/*i*/ ctx[57], ...args);
    	}

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);

    			attr_dev(a, "class", a_class_value = "" + (null_to_empty(/*page*/ ctx[6] === 1 + /*i*/ ctx[57]
    			? 'active disabled'
    			: 'enabled') + " svelte-41wulr"));

    			add_location(a, file$2, 393, 7, 8430);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", click_handler_2, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*page*/ 64 && a_class_value !== (a_class_value = "" + (null_to_empty(/*page*/ ctx[6] === 1 + /*i*/ ctx[57]
    			? 'active disabled'
    			: 'enabled') + " svelte-41wulr"))) {
    				attr_dev(a, "class", a_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(393:6) {#each {length: totalPages} as _, i}",
    		ctx
    	});

    	return block;
    }

    // (312:0) <svelte:component this={ThemeComponent}>
    function create_default_slot(ctx) {
    	let div2;
    	let div1;
    	let t0;
    	let t1;
    	let table;
    	let thead;
    	let tr0;
    	let t2;
    	let tbody;
    	let t3;
    	let t4;
    	let tfoot;
    	let tr1;
    	let t5;
    	let t6;
    	let div0;
    	let div2_class_value;
    	let if_block0 = /*limits*/ ctx[3] && /*totalRows*/ ctx[2] && create_if_block_9(ctx);
    	let if_block1 = /*searchEnabled*/ ctx[5] && create_if_block_8(ctx);
    	let each_value_4 = /*columns*/ ctx[1];
    	validate_each_argument(each_value_4);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		each_blocks_2[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
    	}

    	let if_block2 = (!/*rows*/ ctx[0] || /*rows*/ ctx[0].length === 0) && create_if_block_4(ctx);
    	let each_value_2 = /*rows*/ ctx[0];
    	validate_each_argument(each_value_2);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_1[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value_1 = /*columns*/ ctx[1];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let if_block3 = /*totalRows*/ ctx[2] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			table = element("table");
    			thead = element("thead");
    			tr0 = element("tr");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t2 = space();
    			tbody = element("tbody");
    			if (if_block2) if_block2.c();
    			t3 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t4 = space();
    			tfoot = element("tfoot");
    			tr1 = element("tr");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t5 = space();
    			if (if_block3) if_block3.c();
    			t6 = space();
    			div0 = element("div");
    			add_location(tr0, file$2, 332, 4, 6619);
    			add_location(thead, file$2, 331, 4, 6606);
    			add_location(tbody, file$2, 351, 4, 7259);
    			add_location(tr1, file$2, 372, 4, 7838);
    			add_location(tfoot, file$2, 371, 4, 7825);
    			attr_dev(table, "class", "svelte-41wulr");
    			add_location(table, file$2, 330, 3, 6593);
    			attr_dev(div0, "class", "clear svelte-41wulr");
    			add_location(div0, file$2, 399, 3, 8722);
    			attr_dev(div1, "class", "inner svelte-41wulr");
    			add_location(div1, file$2, 313, 2, 6106);
    			attr_dev(div2, "class", div2_class_value = "datatable " + (/*disabled*/ ctx[7] ? 'disabled' : '') + " svelte-41wulr");
    			add_location(div2, file$2, 312, 1, 6050);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t0);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(div1, t1);
    			append_dev(div1, table);
    			append_dev(table, thead);
    			append_dev(thead, tr0);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(tr0, null);
    			}

    			append_dev(table, t2);
    			append_dev(table, tbody);
    			if (if_block2) if_block2.m(tbody, null);
    			append_dev(tbody, t3);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(tbody, null);
    			}

    			append_dev(table, t4);
    			append_dev(table, tfoot);
    			append_dev(tfoot, tr1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr1, null);
    			}

    			append_dev(div1, t5);
    			if (if_block3) if_block3.m(div1, null);
    			append_dev(div1, t6);
    			append_dev(div1, div0);
    		},
    		p: function update(ctx, dirty) {
    			if (/*limits*/ ctx[3] && /*totalRows*/ ctx[2]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_9(ctx);
    					if_block0.c();
    					if_block0.m(div1, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*searchEnabled*/ ctx[5]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_8(ctx);
    					if_block1.c();
    					if_block1.m(div1, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty[0] & /*columns, performSort, sort*/ 9218) {
    				each_value_4 = /*columns*/ ctx[1];
    				validate_each_argument(each_value_4);
    				let i;

    				for (i = 0; i < each_value_4.length; i += 1) {
    					const child_ctx = get_each_context_4(ctx, each_value_4, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_4(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(tr0, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_4.length;
    			}

    			if (!/*rows*/ ctx[0] || /*rows*/ ctx[0].length === 0) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_4(ctx);
    					if_block2.c();
    					if_block2.m(tbody, t3);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (dirty[0] & /*rowClick, rows, columns, cellClick*/ 6147) {
    				each_value_2 = /*rows*/ ctx[0];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_2.length;
    			}

    			if (dirty[0] & /*columns*/ 2) {
    				each_value_1 = /*columns*/ ctx[1];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tr1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (/*totalRows*/ ctx[2]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block(ctx);
    					if_block3.c();
    					if_block3.m(div1, t6);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (dirty[0] & /*disabled*/ 128 && div2_class_value !== (div2_class_value = "datatable " + (/*disabled*/ ctx[7] ? 'disabled' : '') + " svelte-41wulr")) {
    				attr_dev(div2, "class", div2_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			destroy_each(each_blocks_2, detaching);
    			if (if_block2) if_block2.d();
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			if (if_block3) if_block3.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(312:0) <svelte:component this={ThemeComponent}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*ThemeComponent*/ ctx[8];

    	function switch_props(ctx) {
    		return {
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = {};

    			if (dirty[0] & /*disabled, page, totalPages, limit, rows, totalRows, columns, sort, searchEnabled, limits*/ 1791 | dirty[2] & /*$$scope*/ 512) {
    				switch_instance_changes.$$scope = { dirty, ctx };
    			}

    			if (switch_value !== (switch_value = /*ThemeComponent*/ ctx[8])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Datatable', slots, []);
    	const dispatch = createEventDispatcher();
    	let { rows = [] } = $$props;
    	let { columns = null } = $$props;
    	let { totalRows = null } = $$props;
    	let { limits = [10, 25, 50, 100] } = $$props;
    	let { limit = null } = $$props;
    	let { search = null } = $$props;
    	let { searchEnabled = true } = $$props;
    	let { page = 1 } = $$props;
    	let { disabled = false } = $$props;
    	let { theme = "Default" } = $$props;
    	let { language = "en" } = $$props;
    	let ThemeComponent;
    	let texts;
    	let totalPages = 1;
    	let sort;
    	let isLoading = false;

    	function getPage() {
    		return page;
    	}

    	function setPage(p) {
    		$$invalidate(6, page = p);
    		return this;
    	}

    	function getColumns() {
    		return columns;
    	}

    	function setColumns(c) {
    		$$invalidate(1, columns = c);
    		return this;
    	}

    	function getRows() {
    		return rows;
    	}

    	function setRows(r) {
    		$$invalidate(0, rows = r);
    		return this;
    	}

    	function getSort() {
    		return sort;
    	}

    	function setSort(s) {
    		$$invalidate(10, sort = s);
    		return this;
    	}

    	function getTotalRows() {
    		return totalRows;
    	}

    	function setTotalRows(t) {
    		$$invalidate(2, totalRows = t);
    		return this;
    	}

    	function getLimits() {
    		return limits;
    	}

    	function setLimits(l) {
    		$$invalidate(3, limits = l);
    		return this;
    	}

    	function getLimit() {
    		return limit;
    	}

    	function setLimit(l) {
    		$$invalidate(4, limit = l);
    		return this;
    	}

    	function getSearch() {
    		return search;
    	}

    	function setSearch(s) {
    		$$invalidate(20, search = s);
    		return this;
    	}

    	function getSearchEnabled() {
    		return searchEnabled;
    	}

    	function setSearchEnabled(s) {
    		$$invalidate(5, searchEnabled = s);
    		return this;
    	}

    	function getDisabled() {
    		return disabled;
    	}

    	function setDisabled(d) {
    		$$invalidate(7, disabled = d);
    		return this;
    	}

    	function getTheme() {
    		return theme;
    	}

    	function setTheme(t) {
    		$$invalidate(18, theme = t);
    		return this;
    	}

    	function getLanguage() {
    		return language;
    	}

    	function setLanguage(l) {
    		$$invalidate(19, language = l);
    		return this;
    	}

    	function getTotalPages() {
    		return totalPages;
    	}

    	function rowClick(originalEvent, row) {
    		dispatch('rowClick', { originalEvent, row });
    	}

    	function cellClick(originalEvent, row, column) {
    		dispatch('cellClick', { originalEvent, row, column });
    	}

    	function performSort(originalEvent, column) {
    		if (!originalEvent.target.classList.contains('sortable')) return;
    		let oldColumn = sort?.column;
    		let newColumn = column;

    		$$invalidate(10, sort = {
    			column: newColumn,
    			order: oldColumn && oldColumn.key !== newColumn.key || sort?.order !== 'asc'
    			? 'asc'
    			: 'desc'
    		});

    		dispatch('sortChange', {
    			originalEvent,
    			column: sort.column,
    			order: sort.order
    		});
    	}

    	let searchSubmissionTimer;

    	function searchKeyup(originalEvent) {
    		let query = this.value;
    		clearTimeout(searchSubmissionTimer);
    		searchSubmissionTimer = setTimeout(() => dispatch('searchChange', { originalEvent, query }), 654);
    	}

    	function limitChange(originalEvent) {
    		$$invalidate(4, limit = parseInt(this.value) || limits[0]);
    		dispatch('limitChange', { originalEvent, limit });
    	}

    	function pageChange(originalEvent, newPage) {
    		if (newPage < 1 && newPage > totalPages) return;
    		$$invalidate(6, page = newPage);
    		dispatch('pageChange', { originalEvent, page });
    	}

    	function _(key, vars) {
    		if (!texts[key]) return key;
    		if (typeof texts[key] === 'function') return texts[key](vars);
    		return texts[key];
    	}

    	const writable_props = [
    		'rows',
    		'columns',
    		'totalRows',
    		'limits',
    		'limit',
    		'search',
    		'searchEnabled',
    		'page',
    		'disabled',
    		'theme',
    		'language'
    	];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Datatable> was created with unknown prop '${key}'`);
    	});

    	const click_handler = (column, e) => performSort(e, column);
    	const mouseup_handler = (row, column, e) => cellClick(e, row, column);
    	const mouseup_handler_1 = (row, e) => rowClick(e, row);
    	const click_handler_1 = e => pageChange(e, page - 1);
    	const click_handler_2 = (i, e) => pageChange(e, i + 1);
    	const click_handler_3 = e => pageChange(e, page + 1);

    	$$self.$$set = $$props => {
    		if ('rows' in $$props) $$invalidate(0, rows = $$props.rows);
    		if ('columns' in $$props) $$invalidate(1, columns = $$props.columns);
    		if ('totalRows' in $$props) $$invalidate(2, totalRows = $$props.totalRows);
    		if ('limits' in $$props) $$invalidate(3, limits = $$props.limits);
    		if ('limit' in $$props) $$invalidate(4, limit = $$props.limit);
    		if ('search' in $$props) $$invalidate(20, search = $$props.search);
    		if ('searchEnabled' in $$props) $$invalidate(5, searchEnabled = $$props.searchEnabled);
    		if ('page' in $$props) $$invalidate(6, page = $$props.page);
    		if ('disabled' in $$props) $$invalidate(7, disabled = $$props.disabled);
    		if ('theme' in $$props) $$invalidate(18, theme = $$props.theme);
    		if ('language' in $$props) $$invalidate(19, language = $$props.language);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		themes,
    		languages,
    		dispatch,
    		rows,
    		columns,
    		totalRows,
    		limits,
    		limit,
    		search,
    		searchEnabled,
    		page,
    		disabled,
    		theme,
    		language,
    		ThemeComponent,
    		texts,
    		totalPages,
    		sort,
    		isLoading,
    		getPage,
    		setPage,
    		getColumns,
    		setColumns,
    		getRows,
    		setRows,
    		getSort,
    		setSort,
    		getTotalRows,
    		setTotalRows,
    		getLimits,
    		setLimits,
    		getLimit,
    		setLimit,
    		getSearch,
    		setSearch,
    		getSearchEnabled,
    		setSearchEnabled,
    		getDisabled,
    		setDisabled,
    		getTheme,
    		setTheme,
    		getLanguage,
    		setLanguage,
    		getTotalPages,
    		rowClick,
    		cellClick,
    		performSort,
    		searchSubmissionTimer,
    		searchKeyup,
    		limitChange,
    		pageChange,
    		_
    	});

    	$$self.$inject_state = $$props => {
    		if ('rows' in $$props) $$invalidate(0, rows = $$props.rows);
    		if ('columns' in $$props) $$invalidate(1, columns = $$props.columns);
    		if ('totalRows' in $$props) $$invalidate(2, totalRows = $$props.totalRows);
    		if ('limits' in $$props) $$invalidate(3, limits = $$props.limits);
    		if ('limit' in $$props) $$invalidate(4, limit = $$props.limit);
    		if ('search' in $$props) $$invalidate(20, search = $$props.search);
    		if ('searchEnabled' in $$props) $$invalidate(5, searchEnabled = $$props.searchEnabled);
    		if ('page' in $$props) $$invalidate(6, page = $$props.page);
    		if ('disabled' in $$props) $$invalidate(7, disabled = $$props.disabled);
    		if ('theme' in $$props) $$invalidate(18, theme = $$props.theme);
    		if ('language' in $$props) $$invalidate(19, language = $$props.language);
    		if ('ThemeComponent' in $$props) $$invalidate(8, ThemeComponent = $$props.ThemeComponent);
    		if ('texts' in $$props) $$invalidate(46, texts = $$props.texts);
    		if ('totalPages' in $$props) $$invalidate(9, totalPages = $$props.totalPages);
    		if ('sort' in $$props) $$invalidate(10, sort = $$props.sort);
    		if ('isLoading' in $$props) isLoading = $$props.isLoading;
    		if ('searchSubmissionTimer' in $$props) searchSubmissionTimer = $$props.searchSubmissionTimer;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*theme, ThemeComponent, language, columns, rows, limit, limits, totalRows, totalPages*/ 787231 | $$self.$$.dirty[1] & /*texts*/ 32768) {
    			{
    				$$invalidate(8, ThemeComponent = typeof theme === 'string' ? themes[theme] : theme);
    				if (!ThemeComponent || typeof ThemeComponent !== 'function') $$invalidate(8, ThemeComponent = Default);

    				$$invalidate(46, texts = typeof language === 'string'
    				? languages[language]
    				: language);

    				if (!texts || typeof texts !== 'object') $$invalidate(46, texts = en);

    				if (columns && columns.length) {
    					$$invalidate(1, columns = columns.map(c => {
    						let key, label, sortable = !!c.sortable;

    						if (typeof c === 'string') key = label = c; else {
    							key = c.key;
    							label = c.label ?? key;
    						}

    						return { key, label, sortable };
    					}));
    				} else {
    					if (rows.length) $$invalidate(1, columns = Object.keys(rows[0]).map(k => {
    						return { key: k, label: k, sortable: false };
    					})); else $$invalidate(1, columns = []);
    				}

    				if (!limit && limits && limits.length) {
    					$$invalidate(4, limit = limits[0]);
    				}

    				if (totalRows && limit) {
    					$$invalidate(9, totalPages = Math.ceil(totalRows / limit));
    					if (!totalPages) $$invalidate(9, totalPages = 1);
    				}
    			} // if (options?.texts)
    			// 	Object.assign(texts, options.texts);
    		}
    	};

    	return [
    		rows,
    		columns,
    		totalRows,
    		limits,
    		limit,
    		searchEnabled,
    		page,
    		disabled,
    		ThemeComponent,
    		totalPages,
    		sort,
    		rowClick,
    		cellClick,
    		performSort,
    		searchKeyup,
    		limitChange,
    		pageChange,
    		_,
    		theme,
    		language,
    		search,
    		getPage,
    		setPage,
    		getColumns,
    		setColumns,
    		getRows,
    		setRows,
    		getSort,
    		setSort,
    		getTotalRows,
    		setTotalRows,
    		getLimits,
    		setLimits,
    		getLimit,
    		setLimit,
    		getSearch,
    		setSearch,
    		getSearchEnabled,
    		setSearchEnabled,
    		getDisabled,
    		setDisabled,
    		getTheme,
    		setTheme,
    		getLanguage,
    		setLanguage,
    		getTotalPages,
    		texts,
    		click_handler,
    		mouseup_handler,
    		mouseup_handler_1,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3
    	];
    }

    class Datatable extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$9,
    			create_fragment$9,
    			safe_not_equal,
    			{
    				rows: 0,
    				columns: 1,
    				totalRows: 2,
    				limits: 3,
    				limit: 4,
    				search: 20,
    				searchEnabled: 5,
    				page: 6,
    				disabled: 7,
    				theme: 18,
    				language: 19,
    				getPage: 21,
    				setPage: 22,
    				getColumns: 23,
    				setColumns: 24,
    				getRows: 25,
    				setRows: 26,
    				getSort: 27,
    				setSort: 28,
    				getTotalRows: 29,
    				setTotalRows: 30,
    				getLimits: 31,
    				setLimits: 32,
    				getLimit: 33,
    				setLimit: 34,
    				getSearch: 35,
    				setSearch: 36,
    				getSearchEnabled: 37,
    				setSearchEnabled: 38,
    				getDisabled: 39,
    				setDisabled: 40,
    				getTheme: 41,
    				setTheme: 42,
    				getLanguage: 43,
    				setLanguage: 44,
    				getTotalPages: 45
    			},
    			null,
    			[-1, -1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Datatable",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get rows() {
    		throw new Error("<Datatable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rows(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get columns() {
    		throw new Error("<Datatable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set columns(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get totalRows() {
    		throw new Error("<Datatable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set totalRows(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get limits() {
    		throw new Error("<Datatable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set limits(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get limit() {
    		throw new Error("<Datatable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set limit(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get search() {
    		throw new Error("<Datatable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set search(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get searchEnabled() {
    		throw new Error("<Datatable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set searchEnabled(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get page() {
    		throw new Error("<Datatable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set page(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Datatable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get theme() {
    		throw new Error("<Datatable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set theme(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get language() {
    		throw new Error("<Datatable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set language(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getPage() {
    		return this.$$.ctx[21];
    	}

    	set getPage(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setPage() {
    		return this.$$.ctx[22];
    	}

    	set setPage(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getColumns() {
    		return this.$$.ctx[23];
    	}

    	set getColumns(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setColumns() {
    		return this.$$.ctx[24];
    	}

    	set setColumns(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getRows() {
    		return this.$$.ctx[25];
    	}

    	set getRows(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setRows() {
    		return this.$$.ctx[26];
    	}

    	set setRows(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getSort() {
    		return this.$$.ctx[27];
    	}

    	set getSort(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setSort() {
    		return this.$$.ctx[28];
    	}

    	set setSort(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getTotalRows() {
    		return this.$$.ctx[29];
    	}

    	set getTotalRows(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setTotalRows() {
    		return this.$$.ctx[30];
    	}

    	set setTotalRows(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getLimits() {
    		return this.$$.ctx[31];
    	}

    	set getLimits(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setLimits() {
    		return this.$$.ctx[32];
    	}

    	set setLimits(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getLimit() {
    		return this.$$.ctx[33];
    	}

    	set getLimit(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setLimit() {
    		return this.$$.ctx[34];
    	}

    	set setLimit(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getSearch() {
    		return this.$$.ctx[35];
    	}

    	set getSearch(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setSearch() {
    		return this.$$.ctx[36];
    	}

    	set setSearch(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getSearchEnabled() {
    		return this.$$.ctx[37];
    	}

    	set getSearchEnabled(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setSearchEnabled() {
    		return this.$$.ctx[38];
    	}

    	set setSearchEnabled(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getDisabled() {
    		return this.$$.ctx[39];
    	}

    	set getDisabled(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setDisabled() {
    		return this.$$.ctx[40];
    	}

    	set setDisabled(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getTheme() {
    		return this.$$.ctx[41];
    	}

    	set getTheme(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setTheme() {
    		return this.$$.ctx[42];
    	}

    	set setTheme(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getLanguage() {
    		return this.$$.ctx[43];
    	}

    	set getLanguage(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setLanguage() {
    		return this.$$.ctx[44];
    	}

    	set setLanguage(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getTotalPages() {
    		return this.$$.ctx[45];
    	}

    	set getTotalPages(value) {
    		throw new Error("<Datatable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\tables\Offline-Example-1.svelte generated by Svelte v3.40.3 */

    function create_fragment$8(ctx) {
    	let datatable_1;
    	let current;
    	let datatable_1_props = { columns: /*columns*/ ctx[1] };
    	datatable_1 = new Datatable({ props: datatable_1_props, $$inline: true });
    	/*datatable_1_binding*/ ctx[3](datatable_1);
    	datatable_1.$on("sortChange", /*loadData*/ ctx[2]);
    	datatable_1.$on("searchChange", /*loadData*/ ctx[2]);
    	datatable_1.$on("limitChange", /*loadData*/ ctx[2]);
    	datatable_1.$on("pageChange", /*loadData*/ ctx[2]);

    	const block = {
    		c: function create() {
    			create_component(datatable_1.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(datatable_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const datatable_1_changes = {};
    			datatable_1.$set(datatable_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(datatable_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(datatable_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			/*datatable_1_binding*/ ctx[3](null);
    			destroy_component(datatable_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Offline_Example_1', slots, []);
    	let data = [];

    	for (let i = 1; i <= 100; ++i) data.push({
    		title: `Title ${i}`,
    		random: Math.random(),
    		createdAt: new Date().toLocaleString(),
    		updatedAt: new Date().toLocaleString()
    	});

    	let datatable;

    	let columns = [
    		{
    			key: 'title',
    			label: 'Title',
    			sortable: true
    		},
    		{
    			key: 'random',
    			label: 'Random',
    			sortable: true
    		},
    		{
    			key: 'updatedAt',
    			label: 'Updated at',
    			sortable: true
    		},
    		{
    			key: 'createdAt',
    			label: 'Created at',
    			sortable: true
    		}
    	];

    	async function loadData() {
    		datatable.setDisabled(true);
    		let results = data;
    		if (datatable.getSearch()) results = results.filter(r => r.title.includes(datatable.getSearch()));

    		if (datatable.getSort()) {
    			let { column, order } = datatable.getSort();
    			order = order === 'asc' ? 1 : -1;
    			results.sort((a, b) => a[column.key] > b[column.key] ? order : -order);
    		}

    		if (datatable.getLimit()) {
    			let end = datatable.getPage() * datatable.getLimit();
    			let start = end - datatable.getLimit();
    			results = data.slice(start, end);
    		}

    		datatable.setRows(results);
    		datatable.setTotalRows(data.length);
    		datatable.setDisabled(false);
    	}

    	onMount(loadData);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Offline_Example_1> was created with unknown prop '${key}'`);
    	});

    	function datatable_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			datatable = $$value;
    			$$invalidate(0, datatable);
    		});
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		Datatable,
    		data,
    		datatable,
    		columns,
    		loadData
    	});

    	$$self.$inject_state = $$props => {
    		if ('data' in $$props) data = $$props.data;
    		if ('datatable' in $$props) $$invalidate(0, datatable = $$props.datatable);
    		if ('columns' in $$props) $$invalidate(1, columns = $$props.columns);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [datatable, columns, loadData, datatable_1_binding];
    }

    class Offline_Example_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Offline_Example_1",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\tables\Offline-Example-2.svelte generated by Svelte v3.40.3 */

    function create_fragment$7(ctx) {
    	let datatable_1;
    	let current;

    	let datatable_1_props = {
    		columns: /*columns*/ ctx[5],
    		rows: /*rows*/ ctx[3],
    		disabled: /*disabled*/ ctx[2],
    		totalRows: /*totalRows*/ ctx[4],
    		limit: /*limit*/ ctx[1]
    	};

    	datatable_1 = new Datatable({ props: datatable_1_props, $$inline: true });
    	/*datatable_1_binding*/ ctx[10](datatable_1);
    	datatable_1.$on("sortChange", /*sortChange*/ ctx[6]);
    	datatable_1.$on("searchChange", /*searchChange*/ ctx[7]);
    	datatable_1.$on("limitChange", /*limitChange*/ ctx[8]);
    	datatable_1.$on("pageChange", /*pageChange*/ ctx[9]);

    	const block = {
    		c: function create() {
    			create_component(datatable_1.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(datatable_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const datatable_1_changes = {};
    			if (dirty & /*rows*/ 8) datatable_1_changes.rows = /*rows*/ ctx[3];
    			if (dirty & /*disabled*/ 4) datatable_1_changes.disabled = /*disabled*/ ctx[2];
    			if (dirty & /*totalRows*/ 16) datatable_1_changes.totalRows = /*totalRows*/ ctx[4];
    			if (dirty & /*limit*/ 2) datatable_1_changes.limit = /*limit*/ ctx[1];
    			datatable_1.$set(datatable_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(datatable_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(datatable_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			/*datatable_1_binding*/ ctx[10](null);
    			destroy_component(datatable_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Offline_Example_2', slots, []);
    	let data = [];

    	for (let i = 1; i <= 100; ++i) data.push({
    		title: `Title ${i}`,
    		random: Math.random(),
    		createdAt: new Date().toLocaleString(),
    		updatedAt: new Date().toLocaleString()
    	});

    	let datatable;
    	let search, sortOrder, sortColumn, page, limit = 10;
    	let disabled = false;
    	let rows = [], totalRows = 0;

    	let columns = [
    		{
    			key: 'title',
    			label: 'Title',
    			sortable: true
    		},
    		{
    			key: 'random',
    			label: 'Random',
    			sortable: true
    		},
    		{
    			key: 'updatedAt',
    			label: 'Updated at',
    			sortable: true
    		},
    		{
    			key: 'createdAt',
    			label: 'Created at',
    			sortable: true
    		}
    	];

    	async function loadData() {
    		$$invalidate(2, disabled = true);
    		let results = data;
    		if (search) results = results.filter(r => r.title.includes(search));

    		if (sortColumn) {
    			let order = sortOrder === 'asc' ? 1 : -1;
    			results.sort((a, b) => a[sortColumn] > b[sortColumn] ? order : -order);
    		}

    		if (limit) {
    			let end = (page || 1) * limit;
    			let start = end - limit;
    			results = data.slice(start, end);
    		}

    		$$invalidate(3, rows = results);
    		$$invalidate(4, totalRows = data.length);
    		$$invalidate(2, disabled = false);
    	}

    	function sortChange(event) {
    		page = 1;
    		sortOrder = event.detail.order;
    		sortColumn = event.detail.column.key;
    		loadData();
    	}

    	function searchChange(event) {
    		page = 1;
    		search = event.detail.search;
    		loadData();
    	}

    	function limitChange(event) {
    		page = 1;
    		$$invalidate(1, limit = event.detail.limit);
    		loadData();
    	}

    	function pageChange(event) {
    		page = event.detail.page;
    		loadData();
    	}

    	onMount(loadData);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Offline_Example_2> was created with unknown prop '${key}'`);
    	});

    	function datatable_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			datatable = $$value;
    			$$invalidate(0, datatable);
    		});
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		Datatable,
    		data,
    		datatable,
    		search,
    		sortOrder,
    		sortColumn,
    		page,
    		limit,
    		disabled,
    		rows,
    		totalRows,
    		columns,
    		loadData,
    		sortChange,
    		searchChange,
    		limitChange,
    		pageChange
    	});

    	$$self.$inject_state = $$props => {
    		if ('data' in $$props) data = $$props.data;
    		if ('datatable' in $$props) $$invalidate(0, datatable = $$props.datatable);
    		if ('search' in $$props) search = $$props.search;
    		if ('sortOrder' in $$props) sortOrder = $$props.sortOrder;
    		if ('sortColumn' in $$props) sortColumn = $$props.sortColumn;
    		if ('page' in $$props) page = $$props.page;
    		if ('limit' in $$props) $$invalidate(1, limit = $$props.limit);
    		if ('disabled' in $$props) $$invalidate(2, disabled = $$props.disabled);
    		if ('rows' in $$props) $$invalidate(3, rows = $$props.rows);
    		if ('totalRows' in $$props) $$invalidate(4, totalRows = $$props.totalRows);
    		if ('columns' in $$props) $$invalidate(5, columns = $$props.columns);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		datatable,
    		limit,
    		disabled,
    		rows,
    		totalRows,
    		columns,
    		sortChange,
    		searchChange,
    		limitChange,
    		pageChange,
    		datatable_1_binding
    	];
    }

    class Offline_Example_2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Offline_Example_2",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\tables\Online-Example.svelte generated by Svelte v3.40.3 */

    function create_fragment$6(ctx) {
    	let datatable_1;
    	let current;
    	let datatable_1_props = { columns: /*columns*/ ctx[1] };
    	datatable_1 = new Datatable({ props: datatable_1_props, $$inline: true });
    	/*datatable_1_binding*/ ctx[3](datatable_1);
    	datatable_1.$on("sortChange", /*loadData*/ ctx[2]);
    	datatable_1.$on("searchChange", /*loadData*/ ctx[2]);
    	datatable_1.$on("limitChange", /*loadData*/ ctx[2]);
    	datatable_1.$on("pageChange", /*loadData*/ ctx[2]);

    	const block = {
    		c: function create() {
    			create_component(datatable_1.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(datatable_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const datatable_1_changes = {};
    			datatable_1.$set(datatable_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(datatable_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(datatable_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			/*datatable_1_binding*/ ctx[3](null);
    			destroy_component(datatable_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const serverEndpoint = 'http://myserver.local/get-table-data';

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Online_Example', slots, []);
    	let datatable;

    	let columns = [
    		{
    			key: 'title',
    			label: 'Title',
    			sortable: true
    		},
    		{
    			key: 'random',
    			label: 'Random',
    			sortable: true
    		},
    		{
    			key: 'updatedAt',
    			label: 'Updated at',
    			sortable: true
    		},
    		{
    			key: 'createdAt',
    			label: 'Created at',
    			sortable: true
    		}
    	];

    	async function loadData() {
    		datatable.setDisabled(true);
    		let query = {};
    		if (datatable.getSearch()) query.search = datatable.getSearch();
    		if (datatable.getLimit()) query.limit = datatable.getLimit();
    		if (datatable.getPage()) query.page = datatable.getPage();
    		let sort = datatable.getSort();
    		if (sort?.column.key) query.column = sort.column.key;
    		if (sort?.order) query.order = sort.order;
    		let params = new URLSearchParams(query);
    		let querystring = params.toString();

    		try {
    			let response = await fetch(`${serverEndpoint}?${querystring}`).then(r => r.json());
    			datatable.setRows(response.results);
    			datatable.setTotalRows(response.resultsCount);
    		} catch(e) {
    			datatable.setRows([]);
    			datatable.setTotalRows(0);
    		}

    		datatable.setDisabled(false);
    	}

    	onMount(loadData);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Online_Example> was created with unknown prop '${key}'`);
    	});

    	function datatable_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			datatable = $$value;
    			$$invalidate(0, datatable);
    		});
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		Datatable,
    		serverEndpoint,
    		datatable,
    		columns,
    		loadData
    	});

    	$$self.$inject_state = $$props => {
    		if ('datatable' in $$props) $$invalidate(0, datatable = $$props.datatable);
    		if ('columns' in $$props) $$invalidate(1, columns = $$props.columns);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [datatable, columns, loadData, datatable_1_binding];
    }

    class Online_Example extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Online_Example",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\tables\RowClickExample.svelte generated by Svelte v3.40.3 */

    function create_fragment$5(ctx) {
    	let datatable_1;
    	let current;
    	let datatable_1_props = {};
    	datatable_1 = new Datatable({ props: datatable_1_props, $$inline: true });
    	/*datatable_1_binding*/ ctx[2](datatable_1);
    	datatable_1.$on("searchChange", /*loadData*/ ctx[1]);
    	datatable_1.$on("limitChange", /*loadData*/ ctx[1]);
    	datatable_1.$on("pageChange", /*loadData*/ ctx[1]);
    	datatable_1.$on("rowClick", rowClick);

    	const block = {
    		c: function create() {
    			create_component(datatable_1.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(datatable_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const datatable_1_changes = {};
    			datatable_1.$set(datatable_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(datatable_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(datatable_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			/*datatable_1_binding*/ ctx[2](null);
    			destroy_component(datatable_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function rowClick(event) {
    	alert(`You clicked on row "${event.detail.row.id}"`);
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('RowClickExample', slots, []);
    	let data = [];

    	for (let i = 1; i <= 100; ++i) data.push({
    		id: '#' + i,
    		title: `Title ${i}`,
    		random: Math.random(),
    		createdAt: new Date().toLocaleString(),
    		updatedAt: new Date().toLocaleString()
    	});

    	let datatable;

    	async function loadData() {
    		datatable.setDisabled(true);
    		let results = data;
    		if (datatable.getSearch()) results = results.filter(r => r.title.includes(datatable.getSearch()));

    		if (datatable.getLimit()) {
    			let end = datatable.getPage() * datatable.getLimit();
    			let start = end - datatable.getLimit();
    			results = data.slice(start, end);
    		}

    		datatable.setRows(results);
    		datatable.setTotalRows(data.length);
    		datatable.setDisabled(false);
    	}

    	onMount(loadData);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<RowClickExample> was created with unknown prop '${key}'`);
    	});

    	function datatable_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			datatable = $$value;
    			$$invalidate(0, datatable);
    		});
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		Datatable,
    		data,
    		datatable,
    		loadData,
    		rowClick
    	});

    	$$self.$inject_state = $$props => {
    		if ('data' in $$props) data = $$props.data;
    		if ('datatable' in $$props) $$invalidate(0, datatable = $$props.datatable);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [datatable, loadData, datatable_1_binding];
    }

    class RowClickExample extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RowClickExample",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\tables\CellClickExample.svelte generated by Svelte v3.40.3 */

    function create_fragment$4(ctx) {
    	let datatable_1;
    	let current;
    	let datatable_1_props = {};
    	datatable_1 = new Datatable({ props: datatable_1_props, $$inline: true });
    	/*datatable_1_binding*/ ctx[2](datatable_1);
    	datatable_1.$on("searchChange", /*loadData*/ ctx[1]);
    	datatable_1.$on("limitChange", /*loadData*/ ctx[1]);
    	datatable_1.$on("pageChange", /*loadData*/ ctx[1]);
    	datatable_1.$on("cellClick", cellClick);

    	const block = {
    		c: function create() {
    			create_component(datatable_1.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(datatable_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const datatable_1_changes = {};
    			datatable_1.$set(datatable_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(datatable_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(datatable_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			/*datatable_1_binding*/ ctx[2](null);
    			destroy_component(datatable_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function cellClick(event) {
    	alert(`You clicked on row "${event.detail.row.id}" and column "${event.detail.column.label}".\n` + `This specific cell has the following value: "${event.detail.row[event.detail.column.key]}"`);
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CellClickExample', slots, []);
    	let data = [];

    	for (let i = 1; i <= 100; ++i) data.push({
    		id: '#' + i,
    		title: `Title ${i}`,
    		random: Math.random(),
    		createdAt: new Date().toLocaleString(),
    		updatedAt: new Date().toLocaleString()
    	});

    	let datatable;

    	async function loadData() {
    		datatable.setDisabled(true);
    		let results = data;
    		if (datatable.getSearch()) results = results.filter(r => r.title.includes(datatable.getSearch()));

    		if (datatable.getLimit()) {
    			let end = datatable.getPage() * datatable.getLimit();
    			let start = end - datatable.getLimit();
    			results = data.slice(start, end);
    		}

    		datatable.setRows(results);
    		datatable.setTotalRows(data.length);
    		datatable.setDisabled(false);
    	}

    	onMount(loadData);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CellClickExample> was created with unknown prop '${key}'`);
    	});

    	function datatable_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			datatable = $$value;
    			$$invalidate(0, datatable);
    		});
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		Datatable,
    		data,
    		datatable,
    		loadData,
    		cellClick
    	});

    	$$self.$inject_state = $$props => {
    		if ('data' in $$props) data = $$props.data;
    		if ('datatable' in $$props) $$invalidate(0, datatable = $$props.datatable);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [datatable, loadData, datatable_1_binding];
    }

    class CellClickExample extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CellClickExample",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\tables\StrippedExample.svelte generated by Svelte v3.40.3 */

    function create_fragment$3(ctx) {
    	let datatable;
    	let current;

    	datatable = new Datatable({
    			props: {
    				rows: /*data*/ ctx[0],
    				searchEnabled: false
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(datatable.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(datatable, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(datatable.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(datatable.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(datatable, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('StrippedExample', slots, []);
    	let data = [];

    	for (let i = 1; i <= 10; ++i) data.push({
    		id: '#' + i,
    		title: `Title ${i}`,
    		random: Math.random(),
    		createdAt: new Date().toLocaleString(),
    		updatedAt: new Date().toLocaleString()
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<StrippedExample> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Datatable, data });

    	$$self.$inject_state = $$props => {
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [data];
    }

    class StrippedExample extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StrippedExample",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\tables\CustomStyledExample\Theme.svelte generated by Svelte v3.40.3 */

    const file$1 = "src\\tables\\CustomStyledExample\\Theme.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (default_slot) default_slot.c();
    			attr_dev(main, "class", "svelte-6bt34e");
    			add_location(main, file$1, 42, 0, 812);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);

    			if (default_slot) {
    				default_slot.m(main, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[0],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[0])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[0], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Theme', slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Theme> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class Theme extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Theme",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\tables\CustomStyledExample\Table.svelte generated by Svelte v3.40.3 */

    function create_fragment$1(ctx) {
    	let datatable_1;
    	let current;

    	let datatable_1_props = {
    		columns: /*columns*/ ctx[1],
    		theme: Theme
    	};

    	datatable_1 = new Datatable({ props: datatable_1_props, $$inline: true });
    	/*datatable_1_binding*/ ctx[3](datatable_1);
    	datatable_1.$on("sortChange", /*loadData*/ ctx[2]);
    	datatable_1.$on("searchChange", /*loadData*/ ctx[2]);
    	datatable_1.$on("limitChange", /*loadData*/ ctx[2]);
    	datatable_1.$on("pageChange", /*loadData*/ ctx[2]);

    	const block = {
    		c: function create() {
    			create_component(datatable_1.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(datatable_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const datatable_1_changes = {};
    			datatable_1.$set(datatable_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(datatable_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(datatable_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			/*datatable_1_binding*/ ctx[3](null);
    			destroy_component(datatable_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Table', slots, []);
    	let data = [];

    	for (let i = 1; i <= 100; ++i) data.push({
    		title: `Title ${i}`,
    		random: Math.random(),
    		createdAt: new Date().toLocaleString(),
    		updatedAt: new Date().toLocaleString()
    	});

    	let datatable;

    	let columns = [
    		{
    			key: 'title',
    			label: 'Title',
    			sortable: true
    		},
    		{
    			key: 'random',
    			label: 'Random',
    			sortable: true
    		},
    		{
    			key: 'updatedAt',
    			label: 'Updated at',
    			sortable: true
    		},
    		{
    			key: 'createdAt',
    			label: 'Created at',
    			sortable: true
    		}
    	];

    	async function loadData() {
    		datatable.setDisabled(true);
    		let results = data;
    		if (datatable.getSearch()) results = results.filter(r => r.title.includes(datatable.getSearch()));

    		if (datatable.getSort()) {
    			let { column, order } = datatable.getSort();
    			order = order === 'asc' ? 1 : -1;
    			results.sort((a, b) => a[column.key] > b[column.key] ? order : -order);
    		}

    		if (datatable.getLimit()) {
    			let end = datatable.getPage() * datatable.getLimit();
    			let start = end - datatable.getLimit();
    			results = data.slice(start, end);
    		}

    		datatable.setRows(results);
    		datatable.setTotalRows(data.length);
    		datatable.setDisabled(false);
    	}

    	onMount(loadData);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Table> was created with unknown prop '${key}'`);
    	});

    	function datatable_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			datatable = $$value;
    			$$invalidate(0, datatable);
    		});
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		Datatable,
    		Theme,
    		data,
    		datatable,
    		columns,
    		loadData
    	});

    	$$self.$inject_state = $$props => {
    		if ('data' in $$props) data = $$props.data;
    		if ('datatable' in $$props) $$invalidate(0, datatable = $$props.datatable);
    		if ('columns' in $$props) $$invalidate(1, columns = $$props.columns);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [datatable, columns, loadData, datatable_1_binding];
    }

    class Table extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Table",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.40.3 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let div0;
    	let h20;
    	let t3;
    	let offlineexample1;
    	let t4;
    	let div1;
    	let h21;
    	let t6;
    	let onlineexample;
    	let t7;
    	let div2;
    	let h22;
    	let t9;
    	let offlineexample2;
    	let t10;
    	let div3;
    	let h23;
    	let t12;
    	let rowclickexample;
    	let t13;
    	let div4;
    	let h24;
    	let t15;
    	let cellclickexample;
    	let t16;
    	let div5;
    	let h25;
    	let t18;
    	let strippedexample;
    	let t19;
    	let div6;
    	let h26;
    	let t21;
    	let customstyledexample;
    	let current;
    	offlineexample1 = new Offline_Example_1({ $$inline: true });
    	onlineexample = new Online_Example({ $$inline: true });
    	offlineexample2 = new Offline_Example_2({ $$inline: true });
    	rowclickexample = new RowClickExample({ $$inline: true });
    	cellclickexample = new CellClickExample({ $$inline: true });
    	strippedexample = new StrippedExample({ $$inline: true });
    	customstyledexample = new Table({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Examples";
    			t1 = space();
    			div0 = element("div");
    			h20 = element("h2");
    			h20.textContent = "Offline example #1";
    			t3 = space();
    			create_component(offlineexample1.$$.fragment);
    			t4 = space();
    			div1 = element("div");
    			h21 = element("h2");
    			h21.textContent = "Online example";
    			t6 = space();
    			create_component(onlineexample.$$.fragment);
    			t7 = space();
    			div2 = element("div");
    			h22 = element("h2");
    			h22.textContent = "Offline example #2";
    			t9 = space();
    			create_component(offlineexample2.$$.fragment);
    			t10 = space();
    			div3 = element("div");
    			h23 = element("h2");
    			h23.textContent = "Row click example";
    			t12 = space();
    			create_component(rowclickexample.$$.fragment);
    			t13 = space();
    			div4 = element("div");
    			h24 = element("h2");
    			h24.textContent = "Cell click example";
    			t15 = space();
    			create_component(cellclickexample.$$.fragment);
    			t16 = space();
    			div5 = element("div");
    			h25 = element("h2");
    			h25.textContent = "Stripped example";
    			t18 = space();
    			create_component(strippedexample.$$.fragment);
    			t19 = space();
    			div6 = element("div");
    			h26 = element("h2");
    			h26.textContent = "Custom styled example";
    			t21 = space();
    			create_component(customstyledexample.$$.fragment);
    			add_location(h1, file, 10, 1, 492);
    			add_location(h20, file, 12, 2, 558);
    			attr_dev(div0, "class", "example");
    			attr_dev(div0, "id", "offline-example-1");
    			add_location(div0, file, 11, 1, 511);
    			add_location(h21, file, 16, 2, 660);
    			attr_dev(div1, "class", "example");
    			attr_dev(div1, "id", "online-example");
    			add_location(div1, file, 15, 1, 616);
    			add_location(h22, file, 20, 2, 759);
    			attr_dev(div2, "class", "example");
    			attr_dev(div2, "id", "offline-example-2");
    			add_location(div2, file, 19, 1, 712);
    			add_location(h23, file, 24, 2, 863);
    			attr_dev(div3, "class", "example");
    			attr_dev(div3, "id", "rowclick-example");
    			add_location(div3, file, 23, 1, 817);
    			add_location(h24, file, 28, 2, 967);
    			attr_dev(div4, "class", "example");
    			attr_dev(div4, "id", "cellclick-example");
    			add_location(div4, file, 27, 1, 920);
    			add_location(h25, file, 32, 2, 1072);
    			attr_dev(div5, "class", "example");
    			attr_dev(div5, "id", "stripped-example");
    			add_location(div5, file, 31, 1, 1026);
    			add_location(h26, file, 36, 2, 1179);
    			attr_dev(div6, "class", "example");
    			attr_dev(div6, "id", "custom-styled-example");
    			add_location(div6, file, 35, 1, 1128);
    			add_location(main, file, 9, 0, 484);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, div0);
    			append_dev(div0, h20);
    			append_dev(div0, t3);
    			mount_component(offlineexample1, div0, null);
    			append_dev(main, t4);
    			append_dev(main, div1);
    			append_dev(div1, h21);
    			append_dev(div1, t6);
    			mount_component(onlineexample, div1, null);
    			append_dev(main, t7);
    			append_dev(main, div2);
    			append_dev(div2, h22);
    			append_dev(div2, t9);
    			mount_component(offlineexample2, div2, null);
    			append_dev(main, t10);
    			append_dev(main, div3);
    			append_dev(div3, h23);
    			append_dev(div3, t12);
    			mount_component(rowclickexample, div3, null);
    			append_dev(main, t13);
    			append_dev(main, div4);
    			append_dev(div4, h24);
    			append_dev(div4, t15);
    			mount_component(cellclickexample, div4, null);
    			append_dev(main, t16);
    			append_dev(main, div5);
    			append_dev(div5, h25);
    			append_dev(div5, t18);
    			mount_component(strippedexample, div5, null);
    			append_dev(main, t19);
    			append_dev(main, div6);
    			append_dev(div6, h26);
    			append_dev(div6, t21);
    			mount_component(customstyledexample, div6, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(offlineexample1.$$.fragment, local);
    			transition_in(onlineexample.$$.fragment, local);
    			transition_in(offlineexample2.$$.fragment, local);
    			transition_in(rowclickexample.$$.fragment, local);
    			transition_in(cellclickexample.$$.fragment, local);
    			transition_in(strippedexample.$$.fragment, local);
    			transition_in(customstyledexample.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(offlineexample1.$$.fragment, local);
    			transition_out(onlineexample.$$.fragment, local);
    			transition_out(offlineexample2.$$.fragment, local);
    			transition_out(rowclickexample.$$.fragment, local);
    			transition_out(cellclickexample.$$.fragment, local);
    			transition_out(strippedexample.$$.fragment, local);
    			transition_out(customstyledexample.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(offlineexample1);
    			destroy_component(onlineexample);
    			destroy_component(offlineexample2);
    			destroy_component(rowclickexample);
    			destroy_component(cellclickexample);
    			destroy_component(strippedexample);
    			destroy_component(customstyledexample);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		OfflineExample1: Offline_Example_1,
    		OfflineExample2: Offline_Example_2,
    		OnlineExample: Online_Example,
    		RowClickExample,
    		CellClickExample,
    		StrippedExample,
    		CustomStyledExample: Table
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
