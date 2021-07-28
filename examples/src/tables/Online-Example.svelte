<script>
	import {onMount} from 'svelte';
	import Datatable from '../../../src/Datatable.svelte';

	const serverEndpoint = 'http://myserver.local/get-table-data';

	let datatable;

	let columns = [
		{key: 'title', label: 'Title', sortable: true},
		{key: 'random', label: 'Random', sortable: true},
		{key: 'updatedAt', label: 'Updated at', sortable: true},
		{key: 'createdAt', label: 'Created at', sortable: true}
	];

	async function loadData() {
		datatable.setDisabled(true);

		let query = {};
		if(datatable.getSearch()) query.search = datatable.getSearch();
		if(datatable.getLimit()) query.limit = datatable.getLimit();
		if(datatable.getPage()) query.page = datatable.getPage();
		let sort = datatable.getSort();
		if(sort?.column.key) query.column = sort.column.key;
		if(sort?.order) query.order = sort.order;

		let params = new URLSearchParams(query);
		let querystring = params.toString();
		try {
			let response = await fetch(`${serverEndpoint}?${querystring}`).then(r => r.json());
			datatable.setRows(response.results);
			datatable.setTotalRows(response.resultsCount);
		}catch (e) {
			datatable.setRows([]);
			datatable.setTotalRows(0);
		}

		datatable.setDisabled(false);
	}

	onMount(loadData);
</script>
<Datatable
	bind:this={datatable}
	columns={columns}
	on:sortChange={loadData}
	on:searchChange={loadData}
	on:limitChange={loadData}
	on:pageChange={loadData}
/>