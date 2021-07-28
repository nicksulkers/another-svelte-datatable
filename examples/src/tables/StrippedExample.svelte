<script>
	import Datatable from '../../../src/Datatable.svelte';

	let data = [];
	for(let i = 1; i <= 10; ++i)
		data.push({
			id: '#' + i,
			title: `Title ${i}`,
			random: Math.random(),
			createdAt: new Date().toLocaleString(),
			updatedAt: new Date().toLocaleString()
		});
</script>
<Datatable rows={data} searchEnabled={false}/>