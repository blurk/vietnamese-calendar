import { calendarConverter } from 'utils';

const dateForm = document.getElementById('dateForm');
const notiList = document.getElementById('notiList');

function createLi(date = '', note = '') {
	return `
		<li>
			<strong>${new Date(date).toDateString()}</strong>: <span>${note}</span>
		</li>
	`;
}

const STORAGE_KEY = 'STORAGE';

function getList() {
	return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
}

function appendList(newItem) {
	const prevList = getList();
	localStorage.setItem(STORAGE_KEY, JSON.stringify(prevList.concat(newItem)));
}

function renderList() {
	const list = getList();

	notiList.innerHTML = '';
	list.forEach((item) => {
		notiList.insertAdjacentHTML('beforeend', createLi(item.date, item.note));
	});
}

renderList();

dateForm.addEventListener('submit', function onFormSubmit(event) {
	event.preventDefault();

	const formData = new FormData(event.target);
	const data = Object.fromEntries(formData.entries());

	appendList(data);
	renderList();

	const [year, month, day] = data.date.split('-');
	calendarConverter();
});

let promise = Notification.requestPermission();

promise.then((permission) => {
	if (permission === 'granted') {
	}
});
