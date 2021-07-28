<script>
	import OfflineExample1 from './tables/Offline-Example-1.svelte';
	import OfflineExample2 from './tables/Offline-Example-2.svelte';
	import OnlineExample from './tables/Online-Example.svelte';
	import RowClickExample from './tables/RowClickExample.svelte';
	import CellClickExample from './tables/CellClickExample.svelte';
	import StrippedExample from './tables/StrippedExample.svelte';
	import CustomStyledExample from './tables/CustomStyledExample/Table.svelte';
</script>
<main>
	<h1>Examples</h1>
	<div class="example" id="offline-example-1">
		<h2>Offline example #1</h2>
		<OfflineExample1/>
	</div>
	<div class="example" id="online-example">
		<h2>Online example</h2>
		<OnlineExample/>
	</div>
	<div class="example" id="offline-example-2">
		<h2>Offline example #2</h2>
		<OfflineExample2/>
	</div>
	<div class="example" id="rowclick-example">
		<h2>Row click example</h2>
		<RowClickExample/>
	</div>
	<div class="example" id="cellclick-example">
		<h2>Cell click example</h2>
		<CellClickExample/>
	</div>
	<div class="example" id="stripped-example">
		<h2>Stripped example</h2>
		<StrippedExample/>
	</div>
	<div class="example" id="custom-styled-example">
		<h2>Custom styled example</h2>
		<CustomStyledExample/>
	</div>
</main>