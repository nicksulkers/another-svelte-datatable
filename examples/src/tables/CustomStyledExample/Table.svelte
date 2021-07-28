<script>
	import {onMount} from 'svelte';
	import Datatable from '../../../../src/Datatable.svelte';
	import Theme from './Theme.svelte';

	let data = [];
	for(let i = 1; i <= 100; ++i)
		data.push({
			title: `Title ${i}`,
			random: Math.random(),
			createdAt: new Date().toLocaleString(),
			updatedAt: new Date().toLocaleString()
		});

	let datatable;

	let columns = [
		{key: 'title', label: 'Title', sortable: true},
		{key: 'random', label: 'Random', sortable: true},
		{key: 'updatedAt', label: 'Updated at', sortable: true},
		{key: 'createdAt', label: 'Created at', sortable: true}
	];

	async function loadData() {
		datatable.setDisabled(true);

		let results = data;
		if (datatable.getSearch()) results = results.filter(r => r.title.includes(datatable.getSearch()));
		if (datatable.getSort()){
			let {column, order} = datatable.getSort();
			order = order === 'asc' ? 1 : -1;
			results.sort((a, b) => a[column.key] > b[column.key] ? order : -order);
		}
		if(datatable.getLimit()) {
			let end = datatable.getPage() * datatable.getLimit();
			let start = end - datatable.getLimit();
			results = data.slice(start, end);
		}
		datatable.setRows(results);
		datatable.setTotalRows(data.length);

		datatable.setDisabled(false);
	}

	onMount(loadData);
</script>
<Datatable
	bind:this={datatable}
	columns={columns}
	theme={Theme}
	on:sortChange={loadData}
	on:searchChange={loadData}
	on:limitChange={loadData}
	on:pageChange={loadData}
/>