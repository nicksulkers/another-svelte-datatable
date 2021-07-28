<script>
	import {createEventDispatcher} from 'svelte';
	import * as themes from './themes/index.js';
	import * as languages from './languages/index.js';

	const dispatch = createEventDispatcher();

	export let rows = [];
	export let columns = null;
	export let totalRows = null;
	export let limits = [10, 25, 50, 100];
	export let limit = null;
	export let search = null;
	export let searchEnabled = true;
	export let page = 1;
	export let disabled = false;
	export let theme = "Default";
	export let language = "en";

	let ThemeComponent;
	let texts;
	let totalPages = 1;

	$: {
		ThemeComponent = typeof theme === 'string'
			? themes[theme]
			: theme;
		if (!ThemeComponent || typeof ThemeComponent !== 'function')
			ThemeComponent = themes.Default;

		texts = typeof language === 'string'
			? languages[language]
			: language;
		if (!texts || typeof texts !== 'object')
			texts = languages.en;

		if (columns && columns.length) {
			columns = columns.map(c => {
				let key, label, sortable = !!c.sortable;
				if (typeof c === 'string')
					key = label = c;
				else {
					key = c.key;
					label = c.label ?? key;
				}
				return {key, label, sortable};
			});
		} else {
			if (rows.length)
				columns = Object.keys(rows[0]).map(k => {
					return {key: k, label: k, sortable: false};
				});
			else columns = [];
		}

		if (!limit && limits && limits.length) {
			limit = limits[0];
		}

		if (totalRows && limit) {
			totalPages = Math.ceil(totalRows / limit);
			if (!totalPages) totalPages = 1;
		}

		// if (options?.texts)
		// 	Object.assign(texts, options.texts);
	}

	let sort;
	let isLoading = false;

	export function getPage(){
		return page;
	}
	export function setPage(p){
		page = p;
		return this;
	}
	export function getColumns(){
		return columns;
	}
	export function setColumns(c){
		columns = c;
		return this;
	}
	export function getRows(){
		return rows;
	}
	export function setRows(r){
		rows = r;
		return this;
	}
	export function getSort(){
		return sort;
	}
	export function setSort(s){
		sort = s;
		return this;
	}
	export function getTotalRows(){
		return totalRows;
	}
	export function setTotalRows(t){
		totalRows = t;
		return this;
	}
	export function getLimits(){
		return limits;
	}
	export function setLimits(l){
		limits = l;
		return this;
	}
	export function getLimit(){
		return limit;
	}
	export function setLimit(l){
		limit = l;
		return this;
	}
	export function getSearch(){
		return search;
	}
	export function setSearch(s){
		search = s;
		return this;
	}
	export function getSearchEnabled(){
		return searchEnabled;
	}
	export function setSearchEnabled(s){
		searchEnabled = s;
		return this;
	}
	export function getDisabled(){
		return disabled;
	}
	export function setDisabled(d){
		disabled = d;
		return this;
	}
	export function getTheme(){
		return theme;
	}
	export function setTheme(t){
		theme = t;
		return this;
	}
	export function getLanguage(){
		return language;
	}
	export function setLanguage(l){
		language = l;
		return this;
	}

	export function getTotalPages(){
		return totalPages;
	}

	function rowClick(originalEvent, row) {
		dispatch('rowClick', {originalEvent, row});
	}

	function cellClick(originalEvent, row, column) {
		dispatch('cellClick', {originalEvent, row, column});
	}

	function performSort(originalEvent, column) {
		if (!originalEvent.target.classList.contains('sortable'))
			return;
		let oldColumn = sort?.column;
		let newColumn = column;
		sort = {
			column: newColumn,
			order: oldColumn && oldColumn.key !== newColumn.key || sort?.order !== 'asc' ? 'asc' : 'desc'
		};
		dispatch('sortChange', {originalEvent, column: sort.column, order: sort.order});
	}

	let searchSubmissionTimer;

	function searchKeyup(originalEvent) {
		let query = this.value;
		clearTimeout(searchSubmissionTimer);
		searchSubmissionTimer = setTimeout(() => dispatch('searchChange', {originalEvent, query}), 654);
	}

	function limitChange(originalEvent) {
		limit = parseInt(this.value) || limits[0];
		dispatch('limitChange', {originalEvent, limit});
	}

	function pageChange(originalEvent, newPage) {
		if (newPage < 1 && newPage > totalPages) return;
		page = newPage;
		dispatch('pageChange', {originalEvent, page});
	}

	function _(key, vars) {
		if (!texts[key]) return key;
		if (typeof texts[key] === 'function')
			return texts[key](vars);
		return texts[key];
	}
</script>
<style>
	.datatable {
		padding-bottom: 10px;
		overflow-x: auto;
	}

	.inner {
		min-width: 400px;
	}

	.sortable {
		user-select: none;
		cursor: pointer;
	}

	.sortable:not(:hover) .icon.inactive {
		opacity: .35;
	}

	.icon {
		float: right;
		pointer-events: none;
	}

	table {
		transition: opacity .25s;
	}

	.disabled {
		pointer-events: none;
		opacity: .5;
	}

	.chevron:before {
		border-style: solid;
		border-width: 0.25em 0.25em 0 0;
		content: '';
		display: inline-block;
		height: 0.35em;
		left: 0.15em;
		position: relative;
		top: 0.15em;
		transform: rotate(-45deg);
		vertical-align: top;
		width: 0.35em;
	}

	.chevron-bottom:before {
		top: 0;
		transform: rotate(135deg);
	}

	table {
		border-collapse: collapse;
		width: 100%;
	}

	.limit {
		float: left;
	}

	.search {
		float: right;
	}

	.limit, .search {
		margin-bottom: 15px;
	}

	select, input[type="text"] {
		padding: 3px;
		margin: 0;
		display: inline-block;
		width: initial;
		max-width: 100%;
	}

	.count {
		float: left;
	}

	.pagination {
		float: right;
	}

	.count, .pagination {
		margin-top: 15px;
	}

	.pagination a {
		min-width: 1.5em;
		padding: .5em 1em;
		margin-left: 2px;
		border-radius: 2px;
		border: 1px solid transparent;
	}

	.pagination a.enabled {
		cursor: pointer;
	}

	.clear {
		clear: both;
	}
</style>
<svelte:component this={ThemeComponent}>
	<div class="datatable {disabled ? 'disabled' : ''}">
		<div class="inner">
			{#if limits && totalRows}
				<div class="limit">
					{_('results_limit_pre')}
					<select on:change={limitChange}>
						{#each limits as potentialLimit}
							<option selected={potentialLimit == limit}>{potentialLimit}</option>
						{/each}
					</select>
					{_('results_limit_post')}
				</div>
			{/if}
			{#if searchEnabled}
				<div class="search">
					{_('search')} <input type="text" on:keyup={searchKeyup}/>
				</div>
			{/if}
			<table>
				<thead>
				<tr>
					{#each columns as column}
						<th class="{column.sortable ? 'sortable' : ''}" on:click={e => performSort(e, column)}>
							{column.label}
							{#if column.sortable}
								{#if sort?.column.key !== column.key}
									<span class="icon inactive"><i class="chevron chevron-bottom"></i></span>
								{:else}
									{#if sort.order === 'desc'}
										<span class="icon"><i class="chevron chevron-bottom"></i></span>
									{:else}
										<span class="icon"><i class="chevron chevron-top"></i></span>
									{/if}
								{/if}
							{/if}
						</th>
					{/each}
				</tr>
				</thead>
				<tbody>
				{#if !rows || rows.length === 0}
					<tr>
						<td colspan="{columns.length || 1}" style="text-align: center">{_('no_data_available')}</td>
					</tr>
				{/if}
				{#each rows as row}
					<tr on:mouseup={e => rowClick(e, row)}>
						{#each columns as column}
							<td on:mouseup={e => cellClick(e, row, column)}>
								{#if row[column.key]?.innerHTML}
									{@html row[column.key].innerHTML}
								{:else}
									{row[column.key] ?? ''}
								{/if}
							</td>
						{/each}
					</tr>
				{/each}
				</tbody>
				<tfoot>
				<tr>
					{#each columns as column}
						<th>{column.label}</th>
					{/each}
				</tr>
				</tfoot>
			</table>
			{#if totalRows}
				{#if limit}
					<div class="count">
						{_('results_count', {
							start: (page - 1) * limit + 1,
							end: (page - 1) * limit + rows.length,
							total: totalRows
						})}
					</div>
				{/if}
				{#if totalPages > 1}
					<div class="pagination">
						<a on:click={(e) => pageChange(e, page - 1)} class="previous {page > 1 ? 'enabled' : 'disabled'}">{_('previous')}</a>
						{#each {length: totalPages} as _, i}
							<a on:click={(e) => pageChange(e, i + 1)} class="{page === (1 + i) ? 'active disabled' : 'enabled'}">{i + 1}</a>
						{/each}
						<a on:click={(e) => pageChange(e, page + 1)} class="next {page < totalPages ? 'enabled' : 'disabled'}">{_('next')}</a>
					</div>
				{/if}
			{/if}
			<div class="clear"></div>
		</div>
	</div>
</svelte:component>