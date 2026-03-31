log = console.log;

const app = App();

const data = {
	dialogs: [],
};

const setBkg = flName => {
	if (!flName) return;

	if (flName.endsWith('.mp4')) {
		const srcObj = mediaCache[flName] || './gameSrc/'.concat(flName);
		videoplayer.hidden = false;
		if (videoplayer.src != srcObj) {
			videoplayer.src = srcObj;
			EActors.style.backgroundImage = '';
			EActors.style.backgroundColor = 'gray';
		};
	} else {
		videoplayer.hidden = true;
		EActors.style.backgroundImage = `url( ${mediaCache[flName] || './gameSrc/'.concat(flName)} )`;
	}
};
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
const appData = app.buildData(data);

const txts = document.querySelector("div#storyPhrases");
txts.style.gridRow = `1 / span ${Scenes.story[1]}`;
txts.style.gridColumn = `1 / span ${Scenes.story[0]}`;

const needClicked = new Set();
let currentStep = 1;

(() => {
	if (Scenes.title) document.title = Scenes.title;

	self.mediaCache = Object.create(null);
	const promises = [];
	let lastPromise = null;

	loadMsg.showModal();

	var loaderLogger = hdr => {
		ldCd.textContent += ((hdr.ok ? '✔️' : '❌').concat(hdr.url).concat('\n'));

		ldCd.scrollTop = ldCd.scrollHeight;

		return hdr;
	};

	const handler = async el => {
		if ((el.background) && (!mediaCache[el.background])) {
			let promise = lastPromise = fetch(`./gameSrc/${el.background}`);
			promise = promise.then(data => loaderLogger(data).ok ? data.blob() : null);
			promise.then(blb => mediaCache[el.background] = blb && URL.createObjectURL(blb));

			promises.push(promise);
		}
	}

	let i = 1;
	let scene = null;

	while (scene = Scenes[i]) {
		scene = Scenes[i++];
		handler(scene);
		scene.dialogs.forEach(handler);
	}

	const foo = () => {
		loadMsg.close();
		setScene(1);
	}

	lastPromise.finally(() => Promise.allSettled(promises).finally(foo));
})()

var lastStep = null;
const setScene = self.setScene = (i = 1) => {
	const scene = currentScene = Scenes[i];

	if (scene.background)
		setBkg(scene.background);
	else {
		let bkg = scene.dialogs[0];
		if (bkg.showAll)
			bkg = scene.dialogs[1];
		setBkg(bkg.background);
	}

	needClicked.clear();
	appData.dialogs = scene.dialogs;
}

const nextStep = (e) => needClicked.size > 0 ?
	alert('Не просмотрены все фразы!') :
	setScene(e.currentTarget.nextId);

app.repeat('#storyPhrases > div', appData.dialogs, (el, k) => {
	const prop = data.dialogs[k];
	el.children[0].textContent = prop.phrase;

	Object.assign(el.children[0].style, prop.css);

	if (prop.showAll)
		el.classList.add('showAll');
	else {
		needClicked.add(el);
		el.classList.remove('showAll');
	}

	if (prop.next) {
		if (prop.next === -1)
			el.onclick = alert.bind(undefined, 'Конец!');
		else {
			el.classList.add('clicked');
			el.nextId = prop.next;
			el.onclick = nextStep;
		}
	} else {
		el.classList.remove('clicked');
		el.onclick = null;
	}

	el.onmouseenter = () => {
		if (data.dialogs[k].background)
			setBkg(data.dialogs[k].background);
		needClicked.delete(el);
	};
});