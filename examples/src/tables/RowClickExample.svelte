<script>
	import {onMount} from 'svelte';
	import Datatable from '../../../src/Datatable.svelte';

	let data = [];
	for(let i = 1; i <= 100; ++i)
		data.push({
			id: '#' + i,
			title: `Title ${i}`,
			random: Math.random(),
			createdAt: new Date().toLocaleString(),
			updatedAt: new Date().toLocaleString()
		});

	let datatable;

	async function loadData() {
		datatable.setDisabled(true);

		let results = data;
		if (datatable.getSearch()) results = results.filter(r => r.title.includes(datatable.getSearch()));
		if(datatable.getLimit()) {
			let end = datatable.getPage() * datatable.getLimit();
			let start = end - datatable.getLimit();
			results = data.slice(start, end);
		}
		datatable.setRows(results);
		datatable.setTotalRows(data.length);

		datatable.setDisabled(false);
	}

	function rowClick(event){
		alert(`You clicked on row "${event.detail.row.id}"`);
	}

	onMount(loadData);
</script>
<Datatable
	bind:this={datatable}
	on:searchChange={loadData}
	on:limitChange={loadData}
	on:pageChange={loadData}
	on:rowClick={rowClick}
/>