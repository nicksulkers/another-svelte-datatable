<script>
	import {onMount} from 'svelte';
	import Datatable from '../../../src/Datatable.svelte';

	let data = [];
	for(let i = 1; i <= 100; ++i)
		data.push({
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
		{key: 'title', label: 'Title', sortable: true},
		{key: 'random', label: 'Random', sortable: true},
		{key: 'updatedAt', label: 'Updated at', sortable: true},
		{key: 'createdAt', label: 'Created at', sortable: true}
	];

	async function loadData() {
		disabled = true;

		let results = data;
		if (search) results = results.filter(r => r.title.includes(search));
		if (sortColumn){
			let order = sortOrder === 'asc' ? 1 : -1;
			results.sort((a, b) => a[sortColumn] > b[sortColumn] ? order : -order);
		}
		if(limit) {
			let end = (page || 1) * limit;
			let start = end - limit;
			results = data.slice(start, end);
		}
		rows = results;
		totalRows = data.length;

		disabled = false;
	}

	function sortChange(event){
		page = 1;
		sortOrder = event.detail.order;
		sortColumn = event.detail.column.key;
		loadData();
	}
	function searchChange(event){
		page = 1;
		search = event.detail.search;
		loadData();
	}
	function limitChange(event){
		page = 1;
		limit = event.detail.limit;
		loadData();
	}
	function pageChange(event){
		page = event.detail.page;
		loadData();
	}

	onMount(loadData);
</script>
<Datatable
	bind:this={datatable}
	{columns} {rows} {disabled}
	{totalRows} {limit}
	on:sortChange={sortChange}
	on:searchChange={searchChange}
	on:limitChange={limitChange}
	on:pageChange={pageChange}
/>