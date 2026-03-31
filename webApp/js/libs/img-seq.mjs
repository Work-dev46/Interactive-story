
var store = new WeakMap();

export default async (img, img2, urlArr, delay = 5000) => {
	var imgArr = [];
	var prmss = [];

	var currentEl = img;
	img2.src = './gameSrc/'.concat(urlArr[0]);

	urlArr.forEach(url => prmss.push(fetch('./gameSrc/'.concat(url)).then(hr => hr.blob()).then(blob => imgArr.push(URL.createObjectURL(blob)))));

	Promise.all(prmss).then(() => {
		img2.classList.add('seq-anim');
		img.classList.add('seq-anim');

		var currentIndex = 0;
		const intId = setInterval(() => {
			currentEl.src = imgArr[currentIndex++];
			currentEl = currentEl === img ? img2 : img;
			log(55)
			if (currentIndex >= imgArr.length) currentIndex = 0;
		}, 5000);
	});
}