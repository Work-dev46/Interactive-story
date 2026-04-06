log = console.log;

const app = App();

const data = {
	dialogs: [],
};

const appData = app.buildData(data);

/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
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

const txts = document.querySelector("div#storyPhrases");
txts.style.gridRow = `1 / span ${Scenes.story[1]}`;
txts.style.gridColumn = `1 / span ${Scenes.story[0]}`;

var needClicked = new Set();
var countBlocs = 0;
var selectId = -1;
var currentSceneId = 1;

var setKeyController = () => {
	var scrollTo = (parent, target) => {
		const targetTop = target.offsetTop - parent.offsetTop;
		parent.scrollTo({
			top: targetTop,
			behavior: 'smooth'
		});
	};

	var selectedEl = (selectId) => {
		txts.querySelector('div.block.selected')?.classList.remove('selected');

		selEl = txts.querySelectorAll('div.block')[selectId];
		selEl.classList.add('selected');
		scrollTo(storyPhrases, selEl);
		selEl.onmouseenter();
		needClicked.delete(selEl);
	};


	var DOWN	= 1;
	var ENTER	= 2;
	var UP		= 3;
	var BACK	= 4;

	var keyCode = {
		ArrowDown: DOWN,
		KeyS: DOWN,
		Enter: ENTER,
		NumpadEnter: ENTER,
		KeyD: ENTER,
		ArrowRight: ENTER,
		ArrowUp: UP,
		KeyW: UP,
		ArrowLeft: BACK,
		KeyA: BACK,

	};

	var selEl = null;
	var tmpHide = null;
	var intervalId = null;

	document.body.addEventListener('keyup', e => {
		if (keyCode[e.code] === ENTER) {
			if (tmpHide) {
				(selEl = tmpHide).classList.add('selected');
				tmpHide = null;
			} else if (selEl && !nextStep(selEl.nextId))
				selEl = null;
		} else if (keyCode[e.code] === UP) {
			if (e.ctrlKey || e.shiftKey) return clearInterval(intervalId, rot = 0);

			if ((--selectId) < 0) selectId = countBlocs - 1;
			selectedEl(selectId);
		} else if (keyCode[e.code] === DOWN) {
			if (e.ctrlKey || e.shiftKey) return clearInterval(intervalId, rot = 0);

			if (countBlocs - 1 < (++selectId)) selectId = 0;
			selectedEl(selectId);
		} else if (keyCode[e.code] === BACK) {
			if ((!selEl) && (currentSceneId > 1)) setScene(currentSceneId - 1);

			selEl = null;
			tmpHide = txts.querySelector('div.block.selected');
			if (tmpHide) tmpHide.classList.remove('selected');
		}
	});

	var rot = 0;

	document.body.addEventListener('keydown', e => {
		if (!(e.ctrlKey || e.shiftKey)) return;

		if (keyCode[e.code] === UP) {
			if (rot !== UP) intervalId = setInterval(() => storyPhrases.scrollBy(0, -20), 100);
			rot = UP;
		} else if (keyCode[e.code] === DOWN) {
			if (rot !== DOWN) intervalId = setInterval(() => storyPhrases.scrollBy(0, 20), 100);
			rot = DOWN;
		}
	});
}

(() => {
	var enterFullscreen = () => {
		const element = document.documentElement;

		if (element.requestFullscreen)
			element.requestFullscreen();
		else if (element.mozRequestFullScreen) // Firefox
			element.mozRequestFullScreen();
		else if (element.webkitRequestFullscreen) // Chrome, Safari
			element.webkitRequestFullscreen();
		else if (element.msRequestFullscreen) // IE/Edge
			element.msRequestFullscreen();
	}

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

	const controller = new AbortController();
	var signal = (controller).signal;

	const handler = async el => {
		if ((el.background) && (!mediaCache[el.background])) {
			let promise = lastPromise = fetch(`./gameSrc/${el.background}`, { signal });
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

	loadMsg.querySelector('button').onclick = e => {controller.abort(); loadMsg.close()};

	const foo = () => {
		loadMsg.close();
		setScene(1);

		fullScr.showModal();
		const bb = fullScr.querySelectorAll('button');
		bb[0].onclick = () => {
			enterFullscreen();
			fullScr.close();
		}
		bb[1].onclick = () => fullScr.close();

		return setKeyController();
	}

	lastPromise.finally(() => Promise.allSettled(promises).finally(foo));

	document.body.addEventListener('keydown', e => e.key === 'Escape' &&
		confirm('Вы умерены, что хотите вернуться на главную страницу?') &&
		(document.location.href = './'));
})()

var lastStep = null;
const setScene = (i = 1) => {
	const scene = Scenes[currentSceneId = i];
	txts.querySelector('div.block.selected')?.classList.remove('selected');
	countBlocs = 0;
	selectId = -1;

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

const nextStep = nextId => needClicked.size > 0 ?
	alert('Не просмотрены все фразы!') :
	setScene(nextId) || true;

app.repeat('#storyPhrases > div', appData.dialogs, (el, k) => {
	const prop = data.dialogs[k];
	el.children[0].textContent = prop.phrase;

	Object.assign(el.children[0].style, prop.css);

	if (prop.showAll) {
		el.classList.add('showAll');
		el.classList.remove('block');
	} else {
		needClicked.add(el);
		el.classList.add('block');
		el.classList.remove('showAll');
		countBlocs++;
	}

	if (prop.next) {
		el.classList.add('clicked');
		el.nextId = prop.next;

		if (prop.next === -1)
			el.onclick = () => alert('Конец!') || (document.location.href = './end.html');
		else
			el.onclick = nextStep.bind(undefined, prop.next);
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