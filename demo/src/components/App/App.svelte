<script>
  import { ResizableColumns } from '../../../../src/index';

  let left, right, event;

  const update = (e) => {
	left = e.detail.leftWidth;
	right = e.detail.rightWidth;
	event = e.type;
  }

  const cols = ['One', 'Two', 'Three'],
  	rows = cols.concat(['Four']);
</script>

<h1>Demo: Svelte Resize Columns!</h1>

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
<table use:ResizableColumns on:resize-columns-start={update} on:resize-columns-move={update}  on:resize-columns-stop={update}>
  <thead>
    <tr>
	{#each cols as col}
	  <th>Header {col}</th>
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
<div><span class="label">Left(%):</span><span>{left}</span></div>
<div><span class="label">Right(%):</span><span>{right}</span></div>
<div><span class="label">Event:</span><span>{event}</span></div>