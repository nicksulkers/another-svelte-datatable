<style>
	main :global(table th) {
		background-color: #2244cc;
		color: #FFF;
	}

	main :global(table th), main :global(table td) {
		text-align: left;
		padding: 15px;
		border: 1px solid #000;
	}

	main :global(table td) {
		cursor: pointer;
	}

	main :global(table thead th) {
		border-bottom: 1px solid #000;
	}

	main :global(table tfoot th) {
		border-top: 1px solid #000;
	}

	main :global(table tbody tr:nth-child(even)) {
		background-color: #EEEEEE;
	}

	main :global(table tbody tr:nth-child(odd)) {
		background-color: #F9F9F9;
	}

	main :global(table tbody tr:hover) {
		font-weight: bold;
	}

	main :global(.pagination a.active), main :global(.pagination a.enabled:hover) {
		color: #000;
		border: 1px solid #979797;
		background-color: #fff;
	}
</style>
<main>
	<slot/>
</main>