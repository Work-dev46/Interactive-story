log = console.log;

HTMLCollection.prototype.forEach = Array.prototype.forEach;
HTMLCollection.prototype.at = Array.prototype.at;
HTMLElement.prototype.npcId = null;
HTMLElement.prototype.phrases = null;

const app = App();

const data = {
	phrases: [],
	CurrentSceneId: 1,
	npc: [],
};
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
const appData = app.buildData(data);

bReturn.onclick = () => wPop.hidden = true;

document.body.onkeydown = e => {
	if (e.keyCode === 27) {
		dwin.close();
		wPop.hidden = true;
	} else if (e.keyCode === 112)
		wPop.hidden = !wPop.hidden;
}

//bMenu.onclick = () => wPop.hidden = false;
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
app.repeat('.npc-speech', 4).hidden = false;

var CurrentPhrases = Scenes[1].dialogs[0];
var CurrentActorId = 1;
var CurrentStepId = 0;

{
	/**
	 * 
	 * @param {HTMLElement} elm 
	 * @param {number} i 
	 */
	var separatorPhrases = (elm, i) => {
		elm.phrases = CurrentPhrases[i];

		if (elm.phrases && elm.phrases[0]?.manual)
			elm.classList.add('active');
		else {
			elm.classList.remove('active');
			npcBaloonOn(elm, i);
		}
	}

	var closeModals = () => {
		dwin.close();
		document.querySelectorAll('.npc-speech').forEach(el => el.close());
		document.querySelectorAll('.tmp-selected').forEach(el => el.classList.remove('tmp-selected'));
	}; 

	var setStep = (newStep, _noSeparator) => {
		const dialogs = Scenes[appData.CurrentSceneId].dialogs;

		if (dialogs.length >= newStep) {
			closeModals();
			CurrentPhrases = dialogs[CurrentStepId = newStep];
			EActors.setAttribute('step', CurrentStepId);
			if (!_noSeparator) EActors.children.forEach(separatorPhrases);
		}
	};

	var setScene = (code = 1, step = 0) => {
		localStorage.setItem('scene', code);

		var scene = Scenes[appData.CurrentSceneId = code];

		setStep(step, true);

		EActors.setAttribute('scene', appData.CurrentSceneId);

		closeModals();

		var listActors = scene.listActors;
		var prop = null;
		EActors.children.forEach((elm, i) => {
			if (listActors) {
				if (prop = listActors && listActors[i]) {
					elm.hidden = false;
					elm.src = './gameSrc/'.concat(prop.visual);
					elm.removeAttribute('style');

					elm.style.gridColumn = `${prop.pos[0]} / span ${prop.pos[1]}`;
					elm.style.gridRow = `${prop.pos[2]} / span ${prop.pos[3]}`;

					if (prop.offset) {
						elm.style.position = 'relative';
						for (let k in prop.offset) elm.style[k] = prop.offset[k];
					}
				} else
					elm.hidden = true;
			}

			if (scene.background)
				EActors.style.backgroundImage = `url(./gameSrc/${scene.background})`;

			return separatorPhrases(elm, i);
		});
	};

	var setNextScene = (phraseId) => {
		let phrase = CurrentPhrases[CurrentActorId];
		if (phraseId) phrase = phrase[phraseId];
		const code = phrase.next;

		if (code)
			setScene(code);
		else if (phrase.nstep)
			setStep(phrase.nstep);
	}

	var npcBaloonOn = (npc, i) => {
		if (npc && !npc.hidden) {
			const phrases = npc.phrases;
			const el = document.querySelectorAll('.npc-speech')[i];

			if (el.open = phrases) {
				const pos = npc.getBoundingClientRect();
				el.style.top = String(pos.top + (pos.height / 2)).concat('px');
				el.style.left = String(pos.left + (pos.width / 2)).concat('px');

				el.npcId = i;

				el.children[0].textContent = phrases.phrase;
			}
		}
	}

	const actCliced = e => {
		if ((e.target.classList.contains('active')) && (e.target.alt <= CurrentPhrases.length)) {
			dwin.style.left = `${e.clientX}px`;
			dwin.style.top = `${e.clientY}px`;

			appData.phrases = e.target.phrases;

			CurrentActorId = e.target.alt - 1,

			dwin.show();

			document.querySelectorAll('.tmp-selected').forEach(el => el.classList.remove('tmp-selected'));
			e.target.classList.add('tmp-selected');
		}
	}

	for (const img of EActors.children) img.onclick = actCliced;

	setScene();

	for (const el of document.querySelectorAll(':where(#dwin, .npc-speech) button'))
		el.onclick = e => {
			CurrentActorId = e.target.parentElement.npcId ?? CurrentActorId;
			setNextScene(e.target.id);
		}
}

app.xrBind(
	dwin,
	e => e.children[0].children.forEach((e, i) => e.hidden = !(e.innerText = appData.phrases[i]?.phrase))
);