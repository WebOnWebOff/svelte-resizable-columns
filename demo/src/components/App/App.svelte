<script>
	import { ResizableColumns } from '../../../../src/index';

	let left, right, event;

	let show = true;

	const update = (e) => {
		left = e.detail.leftWidth;
		right = e.detail.rightWidth;
		event = e.type;
	}

  	const cols = ['One', 'Two', 'Three'],
	  rows = cols.concat(['Four']),
	  fixedCols = ['One'];

	function isFixed(col) {
		return fixedCols.indexOf(col) === -1 ? null : true;
	}
</script>
<style>
  :global(body) {
	padding:1em;
  }
  h1 {
    color: purple;
  }
  table {
	width: 600px;
  	border-collapse: collapse;
  }
  th {
  	background-color: #4CAF50;
  	font-weight: bold;
  	color: #fff;
  }
  th, td { 
  	border: 1px solid green;
  	padding: 0.4em;
  }
  .label {
	  font-weight: bold;
  }
</style>
<h1>Demo: Svelte Resize Columns!</h1>
<div>
	<input type="checkbox" bind:checked={show}/> Show
</div>
{#if show }
<table use:ResizableColumns on:resize-columns-start={update} on:resize-columns-move={update}  on:resize-columns-stop={update}>
  <thead>
    <tr>
	{#each cols as col}
	<th data-noresize={isFixed(col)}>
		Header {col}{#if isFixed(col)}&nbsp;(FIXED){/if}
	</th>
	{/each}
    </tr>
  </thead>
  
	{#each rows as row}
	<tr>
		{#each cols as col}
		<td>Row {row} -> Col {col}</td>
		{/each}
	</tr>	
	{/each}
</table>
{/if}
<div><span class="label">Left(%):</span><span>{left}</span></div>
<div><span class="label">Right(%):</span><span>{right}</span></div>
<div><span class="label">Event:</span><span>{event}</span></div>