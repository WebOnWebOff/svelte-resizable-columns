<script>
  import { ResizableColumns } from '../../../../src/index';
</script>

<h1>Demo: Svelte Resize Columns!</h1>

<style>
  h1 {
    color: purple;
  }
  table {
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
</style>
<table use:ResizableColumns>
  <thead>
    <tr>
      <th>Column One</th>
      <th>Column Two</th>
      <th>Column Three</th>
    </tr>
  </thead>
	<tr>
		<td>Value One -> One</td>
		<td>Value Two -> One</td>
		<td>Value Three -> One</td>
	</tr>
	<tr>
		<td>Value One -> Two</td>
		<td>Value Two -> Two</td>
		<td>Value Three -> Two</td>
	</tr>
	<tr>
		<td>Value One -> Three</td>
		<td>Value Two -> Three</td>
		<td>Value Three -> Three</td>
	</tr>
</table>