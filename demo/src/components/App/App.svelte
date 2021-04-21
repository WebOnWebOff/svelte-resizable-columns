<script>
  import { ResizableColumns } from '../../../../src/index';
  import { FlexibleColumns } from '../../../../src/index';

  let left, right, table, column, event;

  let tableType = 'flexible';
  let maxWidthTable = 1000;
  let minWidthTable = 500;

  const update = (e) => {
    left = e.detail.leftWidth;
    right = e.detail.rightWidth;
    table = e.detail.tableWidth;
    column = e.detail.columnWidth;
    event = e.type;
  };

  const cols = ['One', 'Two', 'Three', 'Four'],
    rows = cols.concat(['Five']),
    fixedCols = ['Three'];

  function isFixed(col) {
    return fixedCols.indexOf(col) === -1 ? null : true;
  }
</script>

<h1>Demo: Svelte Resize Columns</h1>
<div>
  <label>
    <input type="radio" bind:group={tableType} value={'resizable'} />
    Resizable (%)
  </label>
</div>
<div>
  <label>
    <input type="radio" bind:group={tableType} value={'flexible'} />
    Flexible (px)
  </label>
</div>
{#if tableType === 'resizable'}
  <h2>Resizable Columns (%)</h2>
  <p>
    Uses percentages. Requires a fixed-width table. Adjusts both left and right column widths. Use
    "data-noresize" attribute to ignore column.
  </p>
  <table
    use:ResizableColumns
    on:resize-columns-start={update}
    on:resize-columns-move={update}
    on:resize-columns-stop={update}>
    <thead>
      <tr>
        {#each cols as col}
          <th data-noresize={isFixed(col)}>
            Header {col}
            {#if isFixed(col)}&nbsp;(FIXED){/if}
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
  <div>
    <span class="label">Left(%):</span>
    <span>{left}</span>
  </div>
  <div>
    <span class="label">Right(%):</span>
    <span>{right}</span>
  </div>
  <div>
    <span class="label">Event:</span>
    <span>{event}</span>
  </div>
{/if}
{#if tableType === 'flexible'}
  <h2>Flexible Columns (px)</h2>
  <p>
    Uses pixel widths. Adjusts widths for the relevant column and the table. Use "noresize"
    attribute to ignore column. Local Storage supported by default when table and columns have
    identity attributes ("table-id" and "column-id"). Override storage provider and identity rules
    in the Action parameter options.
  </p>
  <table
    use:FlexibleColumns={{ maxWidthTable, minWidthTable }}
    on:flexible-columns-start={update}
    on:flexible-columns-move={update}
    on:flexible-columns-stop={update}
    table-id="FlexibleTable">
    <thead>
      <tr>
        {#each cols as col}
          <th noresize={isFixed(col)} column-id={col}>
            Header {col}
            {#if isFixed(col)}&nbsp;(FIXED){/if}
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
  <div>
    <span class="label">minWidthTable (px):</span>
    <span>{minWidthTable}</span>
  </div>
  <div>
    <span class="label">maxWidthTable (px):</span>
    <span>{maxWidthTable}</span>
  </div>
  <div>
    <span class="label">Column (px):</span>
    <span>{column}</span>
  </div>
  <div>
    <span class="label">Table (px):</span>
    <span>{table}</span>
  </div>
  <div>
    <span class="label">Event:</span>
    <span>{event}</span>
  </div>
{/if}

<style>
  :global(body) {
    padding: 1em;
  }
  h1 {
    color: purple;
  }
  table {
    border-collapse: collapse;
    width: 600px;
  }
  th {
    background-color: #4caf50;
    color: #fff;
    font-weight: bold;
  }
  th,
  td {
    border: 1px solid green;
    padding: 0.4em;
  }
  .label {
    font-weight: bold;
  }
</style>
