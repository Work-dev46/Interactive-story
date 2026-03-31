var EApp = App();

var srcData = {
	scenesList: structuredClone(Scenes),
	openStep: null,
	openScene: Scenes[1],
	selectedModel: null,
	currentDialog: null,
}

var Bdata = EApp.buildData(srcData);

{
	HTMLElement.prototype.sceneId = -1;

	var binded = e => {
		e.onclick = (eve) => {
			Bdata.openScene = Scenes[eve.target.sceneId];
			setScene(eve.target.sceneId);
			Bdata.openStep = Bdata.openScene.dialogs[0];
		};

		return e;
	};

	EApp.repeat('#editorBotton > button', Bdata.scenesList, (e, k) => {
		e.textContent = k;
		e.sceneId = k;
		e.onclick = (eve) => {
			Bdata.openScene = Scenes[eve.target.sceneId];
			setScene(eve.target.sceneId);
			Bdata.openStep = Bdata.openScene.dialogs[0];

			Bdata.selectedModel = Bdata.openScene.listActors[editorModelList.value = 0];
		};
	},
	)
}

EApp.xrBind(editorLeft, e => {
	e.querySelector('input').value = Bdata.openScene?.background ?? '';
});

Bdata.openStep = Bdata.openScene.dialogs[0];

const updDialogs = () => {
	const dialog = Bdata.currentDialog = Bdata.openStep[editorModelList.value];
	editorDialog.querySelector('textarea').value = dialog ? JSON.stringify(dialog, null, 2) : null;
	editorDialog.querySelector('input').checked = Array.isArray(dialog);

	return Bdata.openStep;
}

EApp.xrBind(editorModelProps, e => {
	editorModelPos.children.forEach((inp, i) => inp.value = Bdata.selectedModel?.pos[i]);
	editorModelVisual.value = Bdata.selectedModel?.visual;
	editorModelOffset.value = Object.entries(Bdata.selectedModel?.offset || {}).flat().join(': ') || null;

	updDialogs();
	
	Bdata.selectedModel;
});

EApp.listBind(
	editorModelList.lastElementChild,
	Bdata.openScene.listActors,
	(e, k) => e.textContent = Bdata.openScene.listActors[e.value = k]?.visual,
	e => Bdata.selectedModel = Bdata.openScene.listActors[e.target.value],
);

Bdata.selectedModel = Bdata.openScene.listActors[editorModelList.value = 0];
Bdata.currentDialog = Bdata.openStep[editorModelList.value];

let x = null;
Component('webApp/com/treeviewe.html', {EApp, DOMBuilder: App.DOMBuilder, Bdata, updDialogs}).then(a => x = a);

EApp.dataBind(Bdata.currentDialog, () => {
	const dialog = Bdata.currentDialog;
	x.build();
	editorDialog.querySelector('textarea').value = dialog ? JSON.stringify(dialog, null, 2) : null;
	editorDialog.querySelector('input').checked = Array.isArray(dialog);
});

EApp.repeat(
	'#editorSteps > button',
	Bdata.openScene.dialogs,
	(el, k) => {
		el.onclick = eve => Bdata.openStep = Bdata.openScene.dialogs[eve.target.textContent];
		el.textContent = k;
	} ,
);

