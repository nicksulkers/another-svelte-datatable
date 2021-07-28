<style>
	main :global(table th), main :global(table td) {
		text-align: left;
		padding: 8px 10px;
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
		background-color: #E7E7E7;
	}

	main :global(.pagination a.active), main :global(.pagination a.enabled:hover) {
		color: #333 !important;
		border: 1px solid #979797;
		background-color: #fff;
		background: -webkit-gradient(linear, left top, left bottom, color-stop(0%, white), color-stop(100%, #dcdcdc));
	}
</style>
<main>
	<slot/>
</main>