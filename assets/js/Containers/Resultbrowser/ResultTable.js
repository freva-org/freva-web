import React, { useRef } from "react";
import PropTypes from "prop-types";
import { Form, Pagination, Table } from "react-bootstrap";
import {
  useTable,
  useSortBy,
  usePagination,
  useGlobalFilter,
} from "react-table";
import { FaSort, FaSortDown, FaSortUp } from "react-icons/fa";
import _ from "lodash";

import Spinner from "../../Components/Spinner";

function GlobalFilter({ globalFilter, setGlobalFilter }) {
  const debouncedSetGlobalFilter = useRef(_.debounce(setGlobalFilter, 300));
  const [value, setValue] = React.useState(globalFilter);

  const onChange = (value) => {
    if (value.length > 2 || value.length === 0) {
      debouncedSetGlobalFilter.current(value);
    }
  };

  // const dobouncedOnChange = _.debounce(onChange, 500);
  return (
    <input
      value={value || ""}
      className="form-control w-100 p-3"
      onChange={(e) => {
        setValue(e.target.value);
        // dobouncedOnChange(e.target.value);
        onChange(e.target.value);
      }}
      placeholder="Search"
    />
  );
}

GlobalFilter.propTypes = {
  globalFilter: PropTypes.string,
  setGlobalFilter: PropTypes.func.isRequired,
};

function ResultTable({
  columns,
  data,
  fetchData,
  loading,
  selectedFacets,
  pageCount: controlledPageCount,
  resultCount,
}) {
  const skipPageResetRef = React.useRef();

  const {
    getTableProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize, sortBy, globalFilter },
    setGlobalFilter,
  } = useTable(
    {
      columns,
      data,
      selectedFacets,
      initialState: {
        pageIndex: 0,
        pageSize: 25,
        sortBy: [],
        globalFilter: "",
      },
      manualPagination: true,
      manualSortBy: true,
      manualGlobalFilter: true,
      autoResetPage: true,
      autoResetSortBy: true,
      autoResetGlobalFilter: true,
      pageCount: controlledPageCount,
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  React.useEffect(() => {
    gotoPage(0);
  }, [selectedFacets]);

  const debouncedFetchData = useRef(_.debounce(fetchData, 250));
  React.useEffect(() => {
    skipPageResetRef.current = true;
    debouncedFetchData.current({
      pageIndex,
      pageSize,
      sortBy,
      globalFilter,
      selectedFacets,
    });
  }, [fetchData, pageIndex, pageSize, sortBy, globalFilter, selectedFacets]);

  React.useEffect(() => {
    // After the table has updated, always remove the flag
    skipPageResetRef.current = false;
  });

  return (
    <div>
      <GlobalFilter
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      />
      <div className="float-end text-muted fw-normal">
        Results found: {resultCount}
      </div>
      <div className="clearfix border-bottom pb-1 mb-1" />
      <Table striped hover responsive {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup) => {
            const { key, ...restHeaderGroupProps } =
              headerGroup.getHeaderGroupProps();
            return (
              <tr key={key} {...restHeaderGroupProps}>
                {headerGroup.headers.map((column) => {
                  const { key, ...restHeaderProps } = column.getHeaderProps(
                    column.canSort ? column.getSortByToggleProps() : undefined
                  );
                  return (
                    <th className="no-break" key={key} {...restHeaderProps}>
                      {column.render("Header")}
                      <span>
                        {column.canSort ? (
                          column.isSorted ? (
                            column.isSortedDesc ? (
                              <FaSortDown />
                            ) : (
                              <FaSortUp />
                            )
                          ) : (
                            <FaSort className="text-muted" />
                          )
                        ) : (
                          ""
                        )}
                      </span>
                    </th>
                  );
                })}
              </tr>
            );
          })}
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td className="text-center" colSpan={columns.length}>
                <Spinner />
              </td>
            </tr>
          ) : page.length === 0 ? (
            <tr>
              <td className="fw-bold text-center" colSpan={columns.length}>
                No elements found
              </td>
            </tr>
          ) : (
            page.map((row) => {
              prepareRow(row);
              const { key, ...restRowProps } = row.getRowProps();
              return (
                <tr key={key} {...restRowProps}>
                  {row.cells.map((cell) => {
                    const { key, ...restCellProps } = cell.getCellProps();
                    return (
                      <td className="text-wrap" key={key} {...restCellProps}>
                        {cell.render("Cell")}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </Table>
      <div className="d-flex justify-content-between px-0">
        <Form.Select
          className="w-25"
          size="sm"
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
          }}
        >
          {[10, 25, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </Form.Select>

        <span>
          Page{" "}
          <strong>
            {pageIndex + 1} of {pageOptions.length}
          </strong>{" "}
        </span>

        <Pagination className="m-0">
          <Pagination.First
            disabled={!canPreviousPage}
            onClick={() => gotoPage(0)}
          />
          <Pagination.Prev
            onClick={() => previousPage()}
            disabled={!canPreviousPage}
          />
          <Pagination.Next onClick={() => nextPage()} disabled={!canNextPage} />
          <Pagination.Last
            onClick={() => gotoPage(pageCount - 1)}
            disabled={!canNextPage}
          />
        </Pagination>
      </div>
    </div>
  );
}

ResultTable.propTypes = {
  columns: PropTypes.array,
  data: PropTypes.array,
  fetchData: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  selectedFacets: PropTypes.object,
  pageCount: PropTypes.number,
  resultCount: PropTypes.number,
};

export default ResultTable;
