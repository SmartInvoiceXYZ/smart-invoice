import styled from 'styled-components';

export const Styles = styled.div`
  display: block;
  max-width: 100%;

  .tableWrap {
    display: block;
    max-width: 100%;
    ${'' /* overflow-x: scroll; */}
    overflow-y: hidden;
    background-color: white;
  }

  table {
    width: 90vw;
    border-spacing: 0;

    tr {
      :last-child {
        td {
          border-bottom: 0;
        }
      }
    }

    th,
    td {
      margin: 0;
      padding: 0.5rem;
      border-bottom: 5px solid #f5f6f8;
      text-align: left;

      width: 1%;
      &.collapse {
        width: 0.0000000001%;
      }

      :nth-child(3) {
        text-align: right;
      }

      :nth-child(4) {
        text-align: left;
        padding-left: 50px;
        max-width: 75px;
      }

      :nth-child(5) {
        text-align: center;
        max-width: 100px;
      }

      :last-child {
        border-right: 0;
        text-align: center;
      }
    }

    th {
      color: #334d6e;
    }

    td {
      color: #707683;
    }
  }

  .pagination {
    padding: 0.5rem;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
  }
`;
