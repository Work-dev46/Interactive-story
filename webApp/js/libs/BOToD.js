self.App = (() => {
	var getEl = el => (el instanceof Element) ? el : document.querySelector(el);
	var parseSelector = (el, selector) => selector.isEl ? 
		el.insertAdjacentElement('beforeend', selector.getEl[0].cloneNode(true)):
		el.querySelector(selector);

	var hasOwnProperty = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);

	var _IS_PROXY = Symbol('isProxy');
	var _MASK = Symbol('mask');
	var _DEEP = Symbol('deep');
	var _PRNTS = Symbol('prnts');
	var _RCODE = Symbol('rootcode');

	var __inptsTyps = {checkbox: true, radio: true};

	var Core = (settingBits = 0, globalHandler, globalCallback) => {
		var EVENT_TYPE = settingBits & 0b1 ? 'input' : 'change';
		var BINDING_PROPERTY = settingBits & 0b10 ? 'textContent' : 'value';

		const glbHandl = (el, key, data) => {
			const prpt = __inptsTyps[el.type] ? 'checked' : BINDING_PROPERTY;
			el[prpt] = data[key]
		}

		const glbCallbk = (el, cop) => {
			const prpt = __inptsTyps[el.type] ? 'checked' : BINDING_PROPERTY;
			cop.obj[cop.prop] = el[prpt];
		}

		globalHandler = (globalHandler) || glbHandl;
		globalCallback = (globalCallback) || glbCallbk;

		var currentObjProp = null;

		var el2handlerBind	= new WeakMap();
		var el2handlerRept	= new WeakMap();
		var El2group		= new WeakMap();
		var el2eventHandler	= new WeakMap();
		var el2fromRepeat	= new WeakSet();

		var repeatStore    	= Object.create(null);
		var bindReset		= Object.create(null);
		var bindUpd			= Object.create(null);

		var tmp = null;
		var maxCode = 1;
		var matrix = Object.create(null);

		var dataStor = new Map();

		var extInterface = null;
		var rootObj = null;

		var fromParents = parents => parents.reduce((acc, p) => acc[p], rootObj);

		var _eachBit = (code, collector, el) => {
			const insert = bcode => (collector[bcode] || (collector[bcode] = new Set())).add(el);

			insert(code = code >> 1 << 1);
			while(code > 0b10) {
				if ((code >>= 1) % 2)
					insert(code = code >> 1 << 1);
			};
		}

		var addBind = (handler, resHandler, el, isKey) => {
			if (isKey) el2fromRepeat.add(handler).add(resHandler);

			var code = currentObjProp.mask;

			let story = Object.create(null);
			story.upd = handler;
			story.res = resHandler;

			el2handlerBind.set(el, story);

			(tmp = bindUpd[code]) || (tmp = bindUpd[code] = Object.create(null));
			(tmp[currentObjProp.prop] = (tmp[currentObjProp.prop] || new Set())).add(el);

			currentObjProp = null;

			return _eachBit(code, bindReset, el);
		}

		var addRepeat = (handler, el, group) => {
			const msk = currentObjProp && currentObjProp.childMask || 0b1;

			el2handlerRept.set(el, handler);

			currentObjProp = null;

			return _eachBit(msk, repeatStore, el);
		}

		var resetEl = elm => {
			if (globalHandler) globalHandler(elm, [null], 0);

			elm[BINDING_PROPERTY] = null;

			const group = El2group.get(elm);
			if (group) {
				var fragment = document.createDocumentFragment();
				Object.values(group).forEach(el => fragment.append(el));
				elm.hidden = false;
			};

			El2group.delete(elm);
			(tmp = el2eventHandler.get(elm)) && (elm.removeEventListener(EVENT_TYPE, tmp));
			el2eventHandler.delete(elm);
		};

		var _unbind = (el, onlyBind) => {
			const elm = getEl(el);

			el2handlerBind.delete(elm);

			elm[BINDING_PROPERTY] = null;

			if (onlyBind) return;

			el2handlerRept.delete(elm);

			return resetEl(elm);
		}

		var _unbindObj = (obj, onlyReset, prop) => {
			obj = prop ? obj[prop] : currentObjProp.obj;

			var ldeep = obj[_DEEP];
			if ((!onlyReset) && (tmp = matrix[ldeep - 1])) delete tmp[prop || currentObjProp.prop];
			currentObjProp = null;
			needStoredGetterFlg = false;

			var handler = onlyReset ? resetEl : _unbind;
			var row = null;

			const msk = obj[_MASK];
			var code = msk;
			for (let i = 1, pow2 = 1; code <= maxCode; i++) {
				(i === pow2) ? (code = msk * i) && (pow2 *= 2) : code++;

				if (!onlyReset) {
					if (code % 2)
						row = matrix[ldeep++];
					else
						for (let prp in row) if (row[prp] === code) delete row[prp];
				}

				[repeatStore, bindReset].forEach(stor => {
					if ((stor[code]) && (tmp = stor[code])) {
						tmp.forEach(el => handler(el));
						if (!onlyReset) delete acc[code];
					}
				});

				if ((tmp = bindUpd[code]) && (tmp = Object.values(tmp))) {
					Object.values(tmp).forEach(itm => itm.forEach(el => handler(el)));
					if (!onlyReset) delete bindUpd[code];
				}
			}

			return obj;
		}

		var needStoredGetterFlg = false;
		var skipProxySetFlg = false;
		var fromRepeat = false;

		var buildData = (obj, code = 0, deepLvl = 0, prnts = [], afProp, rCode) => {
			var matRow = (matrix[deepLvl]) || (matrix[deepLvl] = Object.create(null));

			if (deepLvl !== 0) {
				const cond = prnts[deepLvl - 1] != afProp;  
				prnts = (prnts[deepLvl - 1]) && cond ? Array.from(prnts) : prnts;
				if (afProp && cond) prnts[deepLvl - 1] = afProp;
			}

			return new Proxy(obj, {
				mask: code,
				nextCode: code,
				//rootCode: rcode = deepLvl === 0 ? new Set().add(code) : new Set(rCode).add(code),
				get parents() {return deepLvl === 0 ? prnts : prnts.slice(0, deepLvl)},
				nullCnt: 1,

				get: function(target, prop, receiver) {
					if (prop === _IS_PROXY) return true;
					if (prop === _MASK) return code;
					if (prop === _DEEP) return deepLvl;
					if (prop === _PRNTS) return this.parents;

					if (hasOwnProperty(target, prop)) {
						let childCode;
						if (target[prop] != null) {
							if ((typeof(target[prop]) === 'object') && !(target[prop][_IS_PROXY])) {
								skipProxySetFlg = true;
								childCode = (matRow[prop]) || (matRow[prop] = childCode = 1 << (this.nullCnt++) | this.code);
								receiver[prop] = buildData(target[prop], childCode, deepLvl + 1, prnts, prop);
								skipProxySetFlg = false;

								maxCode = Math.max(maxCode, childCode);
							} else
								childCode = (matRow[prop]) || (matRow[prop] = childCode = 1 << (this.nullCnt++) | this.code);
						}

						if (needStoredGetterFlg) {
							currentObjProp = Object.create(null);
							currentObjProp.mask = code;
							currentObjProp.prop	= prop;
							currentObjProp.obj = receiver;
							currentObjProp.childMask = matRow[prop];

							if (fromRepeat) {
								needStoredGetterFlg = false;
								currentObjProp.val = receiver[prop];
								needStoredGetterFlg = true;
							}
							Object.freeze(currentObjProp);
						}
					}

					return Reflect.get(target, prop, receiver);
				},

				set: function(target, prop, val, receiver) {
					if (!hasOwnProperty(target, prop)) return Reflect.set(target, prop, val, receiver);

					if (!skipProxySetFlg) {
						if ((val) && (typeof(val) === 'object')) {
							if (val[_IS_PROXY]) {
								const h = dataStor.get(code);
								if (h) {
									dataStor.delete(code);
									dataStor.set(val[_MASK], h);
								}
							} else {
								childCode = (matRow[prop]) || (matRow[prop] = childCode = 1 << (this.nullCnt++) | this.code);
								val = buildData(val, childCode, deepLvl + 1, prnts, prop);
							}
						}
					}

					const result = Reflect.set(target, prop, val, receiver);
					if (skipProxySetFlg) return result;

					let storebinds = null, storeRepeats = null;

					const ncode = matRow[prop];

					if (storeRepeats = repeatStore[ncode]) storeRepeats.forEach(el => (tmp = el2handlerRept.get(el))&& tmp(true));

					if (storebinds = bindReset[ncode]) storebinds.forEach(el => (tmp = el2handlerBind.get(el)) && (!el2fromRepeat.has(tmp.res)) && tmp.res(true));

					if ((storebinds = bindUpd[code]) && (storebinds = storebinds[prop]))
						storebinds.forEach(el => (tmp = el2handlerBind.get(el)) && (!el2fromRepeat.has(tmp.upd)) && tmp.upd(true));
					
					dataStor.forEach((h, c) => ((c & code) === Math.min(c, code)) && h());

					return result;
				},

				deleteProperty: function(target, prop) {
					if (!hasOwnProperty(target, prop))
						return Reflect.deleteProperty(target, prop);

					if ((target[prop] instanceof Object) && target[prop][_IS_PROXY]) 
						_unbindObj(target, true, prop);

					return Reflect.deleteProperty(target, prop);
				},
			});
		}

		const bind = (elSel, val, key) => {
			var parents = Array.from(currentObjProp.obj[_PRNTS]), prp = currentObjProp.prop;
			const handler = (el, k) => globalHandler(el, k || prp, fromParents(parents));

			return xrBind(elSel, handler, globalCallback, key, true);
		}

		var xrBind = (el, handler, callback, rptKey, __needCurrObj = false, stateCall) => {
			const elm = getEl(el);

			needStoredGetterFlg = stateCall !== 0;
			handler(elm, rptKey);
			needStoredGetterFlg = false;

			var cObjProp = __needCurrObj ? Object.create(null) : null;
			if (__needCurrObj) {
				cObjProp.obj = currentObjProp.obj;
				cObjProp.prop = currentObjProp.prop;
			}

			if ( (currentObjProp) && !(stateCall && bindUpd[currentObjProp.mask]) )
				addBind(handler.bind(null, elm, rptKey), xrBind.bind(null, elm, handler, callback, rptKey, __needCurrObj), elm, rptKey != null);

			if (tmp = el2eventHandler.get(elm)) elm.removeEventListener(EVENT_TYPE, tmp);

			if (callback) {
				const eventHandler = event => callback(event.currentTarget, cObjProp || rptKey);
				el2eventHandler.set(elm, eventHandler);
				elm.addEventListener(EVENT_TYPE, eventHandler);
			}

			return elm;
		}

		var repeat = (el, iterObj, bindHandle, xrBindCallbackOrFlag = true, prnts, nested, storyCall) => {
			var elm = getEl(el);

			if (bindHandle === true) bindHandle = globalHandler;

			if (typeof(iterObj) === 'number') iterObj = Array(iterObj).fill();

			let iter;
			const group = Object.create(null);
			const updGroup = El2group.get(elm) || Object.create(null);

			if ((!iterObj) || iterObj[_IS_PROXY]) {
				needStoredGetterFlg = true;

				const parents = prnts ? prnts : Array.from((iterObj || currentObjProp.val)[_PRNTS]);
				iter = prnts ? fromParents(prnts) : iterObj || fromParents(parents);

				needStoredGetterFlg = false;
				fromRepeat = false;

				if ((xrBindCallbackOrFlag != null) && bindHandle) {
					if (!(storyCall && repeatStore[iter[_MASK]]))	
						addRepeat(extInterface.repeat.bind(null, elm, null, bindHandle, xrBindCallbackOrFlag, parents, nested), elm, group);

					currentObjProp = null;
				}
			} else {
				xrBindCallbackOrFlag = false;
				iter = iterObj;
			}
			fromRepeat = false;
			El2group.set(elm, group);

			let newEl = null;
			let lastEl = elm;
			for (const key in iter) {
				if (nested || !(key in updGroup)) {
					newEl = elm.cloneNode(true);
					newEl.hidden = false;
					newEl.setAttribute('__key', key);

					lastEl.after(newEl);

					lastEl = (group[key] = newEl);

					if ((xrBindCallbackOrFlag) || (xrBindCallbackOrFlag === null)) {
						xrBind(
							newEl,
							(el, k) => bindHandle(el, k, fromParents(iter[_PRNTS])),
							xrBindCallbackOrFlag instanceof Function ? xrBindCallbackOrFlag : xrBindCallbackOrFlag === null ? null : globalCallback,
							key,
						);
					} else if (bindHandle)
						bindHandle(newEl, key);
				} else {
					lastEl = (group[key] = updGroup[key]);
					if (bindHandle) bindHandle(updGroup[key], key);
				}

				if (!nested) delete updGroup[key];
			}

			if (newEl) elm.hidden = true;

			for (const k in updGroup) {
				tmp = updGroup[k];
				tmp.remove();
				
				tmp.removeEventListener(EVENT_TYPE, el2eventHandler.get(tmp));
				el2eventHandler.delete(tmp);
				el2handlerBind.delete(tmp);
				el2handlerRept.delete(tmp);
				El2group.delete(tmp);
			};

			return elm;
		}

		var handlerNestedRepeat = (listParam, args) => {
			var defFn = (el, k, data) => data[k];
			var stack = [];
			
			var itm = listParam[0];
			stack[0] = (el, data) => repeat(
				parseSelector(el, itm[0]),
				data,
				(e, k, dt) => itm[1](e, k, dt),
				itm[2],
				undefined,
				true,
				true,
			);

			listParam.forEach((itm, i) => {
				if (i === 0) return;

				stack[i] = (afEl, data) => repeat(
					parseSelector(afEl, itm[0]),
					data,
					(el, k, dt) => {
						const newData = (itm[1] || defFn)(el, k, dt);
						stack[i - 1](el, newData);
					},
					itm[2],
					undefined,
					true,
					true,
				);
			});
			
			var afterStack = args[2];
			args[2] = (el, k) => {
				const newData = afterStack(el, k, args[1]);
				stack[stack.length - 1](el, newData);
			};
			args[5] = true;
			
			repeat.apply(null, args);
		};

		const nestedRepeat = (...args) => {
			var listParam = [];

			var nested = (...a) => {
				if (a.length)
					listParam.unshift(a);
				else
					return handlerNestedRepeat(listParam, args);

				return (...b) => {
					needStoredGetterFlg = true;
					return nested(...b);
				};
			};

			return nested;
		}

		const dataBind = (data, handler) => dataStor.set(data[_MASK], handler);

		var listSync = (el, iterObj, bindHandle, callback, callbackEl) => {
			const elm = getEl(el);
			repeat(elm, iterObj, bindHandle, true);

			const eventHandler = event => callback(event.currentTarget, event);
			el2eventHandler.set(elm, eventHandler);
			(callbackEl ? getEl(callbackEl) : elm).parentElement.addEventListener(EVENT_TYPE, callback);
		}

		extInterface = Object.create(null, {
			bind: {get: () => (needStoredGetterFlg = true) && bind},
			repeat: {get: () => (fromRepeat = needStoredGetterFlg = true) && repeat},
			nestedRepeat: {get: () => (fromRepeat = needStoredGetterFlg = true) && nestedRepeat},
			unbindObj: {get: () => (needStoredGetterFlg = true) && _unbindObj},
			listBind: {get: () => (needStoredGetterFlg = true) && listSync},
			dataBind: {get: () => (needStoredGetterFlg = true) && dataBind},
		});

		extInterface.unbind = _unbind;
		extInterface.xrBind = xrBind;
		extInterface.buildData = obj => rootObj = buildData(obj);

		return extInterface;
	};

	Core.DOMBuilder = (docFragment, lastEl) => {
		return new Proxy((...args) => {
			if (!args[0].isEl) {
				if (!(args[0] instanceof Object))
					lastEl.append(args.shift());

				const props = args.shift();
				for (const k in props)
					lastEl.setAttribute(k, props[k]);
			}

			if (args.length) args.shift()._getEl.forEach(el => lastEl.append(el.cloneNode(true)));

			return Core.DOMBuilder(docFragment, lastEl);
		}, {
			get: (target, prop, receiver) => {
				if (typeof prop === 'string') {
					if (prop === 'isEl') return true;
					if (prop === '_getEl') return docFragment.childNodes;
					if (prop === 'getEl') return Array.from(docFragment.childNodes);

					const newEl = document.createElement(prop);
					const df = docFragment || document.createDocumentFragment();
					df.append(newEl);

					return Core.DOMBuilder(df, newEl);
				} else
					return Reflect.get(target, prop, receiver);
			},

			set: () => {throw new SyntaxError("Don't set values!")},
		});
	}

	Core.eventTypeInput = 0b1;
	Core.textContentBinding = 0b10;

	return Core;
})();