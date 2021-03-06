import * as React from "react";
import "antd/dist/antd.css";
import moment from "moment";
import { Table, Button, Select, DatePicker, notification } from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import "./RecordManagement.css";
import RecordDetail from "./RecordDetail";

class RecordManagement extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      record: {
        image: { camera: { location: "" } },
        violationType: { name: "" },
      },
      data: [],
      types: [],
      selectedType: "",
      selectedStatus: "",
      fromDate: moment().startOf("isoWeek").format("yyyy-MM-DD"),
      toDate: moment().endOf("isoWeek").format("yyyy-MM-DD"),
      mode: "view",
      loading: false,
    };
  }

  columns = [
    {
      title: "No.",
      dataIndex: "No",
      key: "no",
      width: "5%",
    },
    {
      title: "Violation Type",
      dataIndex: ["violationType", "name"],
      key: "type",
      ellipsis: true,
      width: "22%",
    },
    {
      title: "License Plate Number",
      dataIndex: "licensePlate",
      key: "licensePlateNumber",
      width: "16%",
    },
    {
      title: "Recorded Time",
      dataIndex: "createdDate",
      key: "time",
      ellipsis: true,
      render: (text) => {
        return moment(text).format("DD/MM/yyyy HH:mm:ss");
      },
      width: "18%",
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
      ellipsis: true,
      width: "15%",
    },
    {
      title: "Status",
      dataIndex: "caseType",
      key: "status",
      render: (text) => {
        const titleCase = (str) => {
          return str
            .toLowerCase()
            .split(" ")
            .map((word) => {
              return word.replace(word[0], word[0].toUpperCase());
            })
            .join(" ");
        };
        return titleCase(text);
      },
      width: "12%",
    },
    {
      title: "View Details",
      dataIndex: "detail",
      key: "detail",
      width: "10%",
      render: (text, record) => (
        <>
          <Button
            type="primary"
            className="detail"
            onClick={() => this.setState({ visible: true, record: record })}
          >
            <FontAwesomeIcon
              icon={faEye}
              style={{ fontSize: 17, alignSelf: "center" }}
            />
          </Button>
        </>
      ),
      width: "12%",
    },
  ];

  fetchAllCases = () => {
    fetch("http://localhost:8080/case/getAll", {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })
      .then((Response) => Response.json())
      .then((cases) => {
        this.setState({ data: cases });
      })
      .catch((error) => {
        console.log(error);
      });
  };

  fetchViolationTypes = () => {
    fetch("http://localhost:8080/case/getViolationType", {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })
      .then((Response) => Response.json())
      .then((types) => {
        this.setState({ types: types });
      })
      .catch((error) => {
        console.log(error);
      });
  };

  filter = (
    from = moment().startOf("isoWeek").format("yyyy-MM-DD HH:mm:ss"),
    to = moment().endOf("isoWeek").format("yyyy-MM-DD HH:mm:ss"),
    violationType = "",
    caseType = ""
  ) => {
    fetch(
      `http://localhost:8080/case/filter?fromDate=${from}&toDate=${to}&violationId=${violationType}&caseType=${caseType}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    )
      .then((Response) => Response.json())
      .then((cases) => {
        if (cases !== null) {
          this.setState({ data: this.addNumberIndex(cases) });
        }
      })
      .catch((error) => {
        console.log("error", error);
        this.setState({ data: null });
      });
  };

  onSelectedType = (value, option) => {
    this.setState({ selectedType: value, loading: true });
    this.filter(
      `${this.state.fromDate} 00:00:00`,
      `${this.state.toDate} 23:59:59`,
      value,
      this.state.selectedStatus
    );
    this.setState({ loading: false });
  };

  onSelectedStatus = (value, option) => {
    this.setState({ selectedStatus: value, loading: true });
    this.filter(
      `${this.state.fromDate} 00:00:00`,
      `${this.state.toDate} 23:59:59`,
      this.state.selectedType,
      value
    );
    this.setState({ loading: false });
  };

  onSelectedDates = (dates, dateStrings) => {
    if (dates) {
      const from = moment(dates[0]).format("yyyy-MM-DD");
      const to = moment(dates[1]).format("yyyy-MM-DD");
      this.setState({
        fromDate: from,
        toDate: to,
        loading: true,
      });
      this.filter(
        `${from} 00:00:00`,
        `${to} 23:59:59`,
        this.state.selectedType,
        this.state.selectedStatus
      );
      this.setState({ loading: false });
    }
  };

  showModal = () => {
    this.setState({ visible: true });
  };

  onClose = () => {
    this.setState({ visible: false });
  };

  componentDidMount = () => {
    this.setState({ loading: true });
    this.fetchViolationTypes();
    // this.fetchAllCases();
    this.filter();
    this.setState({ loading: false });
  };

  addNumberIndex = (caseList) => {
    let index = 1;
    for (let i = 0; i < caseList.length; i++) {
      caseList[i]["No"] = index;
      index++;
    }
    return caseList;
  };

  updateLicense = (number, data) => {
    fetch(
      `http://localhost:8080/case/update?caseId=${data.caseId}&licensePlate=${number}`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    )
      .then((Response) => {
        if (Response.status === 200) {
          notification.success({
            message: "Update license plate number succcessfully!",
            placement: "bottomLeft",
          });
        } else {
          notification.error({
            message: "Update license plate failed!",
            placement: "bottomLeft",
          });
        }
        return Response.json();
      })
      .then((data) => {
        this.setState({ loading: true });
        this.filter();
        this.setState({ visible: true, record: data });
        this.setState({ loading: false });
      });
  };

  closeCancel = () => {
    this.setState({ mode: "view" });
  };

  handleUpdate = (values, data) => {
    this.updateLicense(values.license, data);
  };

  render() {
    return (
      <>
        <div className="background">
          <div className="box">
            <h2 className="title">Records Management</h2>
            <div className="filter">
              <DatePicker.RangePicker
                allowClear={false}
                placeholder={["From", "To"]}
                format="DD/MM/yyyy"
                onChange={this.onSelectedDates}
                defaultValue={[
                  moment().startOf("isoWeek"),
                  moment().endOf("isoWeek"),
                ]}
              />
              <Select
                placeholder="Violation Type"
                defaultValue=""
                onChange={this.onSelectedType}
              >
                <Select.Option value="">All types</Select.Option>
                {this.state.types.map((type) => (
                  <Select.Option
                    key={type.violationId}
                    value={type.violationId}
                  >
                    {type.name}
                  </Select.Option>
                ))}
              </Select>
              <Select
                placeholder="Status"
                defaultValue="unconfirmed"
                onChange={this.onSelectedStatus}
              >
                <Select.Option value="unconfirmed">Unconfirmed</Select.Option>
                <Select.Option value="punishment">Approved</Select.Option>
                <Select.Option value="rejected">Rejected</Select.Option>
              </Select>
            </div>
            <div>
              <Table
                className="table"
                dataSource={this.state.data}
                columns={this.columns}
                loading={this.state.loading}
              />
            </div>
          </div>
        </div>
        <RecordDetail
          visible={this.state.visible}
          data={this.state.record}
          onClose={this.onClose}
          handleUpdate={this.handleUpdate}
        />
      </>
    );
  }
}

export default RecordManagement;
