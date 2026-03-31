/**
 * @author Sergey_Werk
 */

{
	var _insert = (txt, args = Object.create(null)) => {
		const doc = (new DOMParser()).parseFromString(txt, "text/html");
		const jsTxt = doc.querySelector('script').textContent;
		const style = doc.querySelector('style');
		
		if (style) document.head.append(style);

		var element = null;

		const ExComponent = class extends HTMLElement {
			constructor() {
				super();
				this.innerHTML = doc.body.innerHTML;
				element = this;
				this.id = this.tagName.toLowerCase();

				style.textContent = '#'.concat(this.id).concat(' {\n\r').
				concat(style.textContent).concat('\n\r}')
			}
		}

		const constructArgs = ['html', 'ExComponent'];
		const callArgs = [doc.body.innerHTML, ExComponent];

		for (let k in args) {
			constructArgs.push(k);
			callArgs.push(args[k]);
		}

		constructArgs.push('return '.concat(jsTxt.trimStart()));

		const cls = Function.apply(Object.create(null), constructArgs).apply(this, callArgs);

		customElements.define(cls.name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase(), cls);

		return element;
	}

	Object.defineProperty(self, 'Component', {
		configurable: false,
		writable : false,
		enumerable : false,
		
		value: (path, args) => fetch(path).then(hr => hr.ok ? hr.text() : Promise.reject(hr)).
			then(cntx => _insert(cntx, args)),
	}); 
}