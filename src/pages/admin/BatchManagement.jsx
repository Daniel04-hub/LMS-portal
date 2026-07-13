import React, { useEffect, useState } from "react";
import CustomButton from "../../components/CustomButton";

export default function BatchManagement() {
  const [batches, setBatches] = useState([]);

  const [batchName, setBatchName] = useState("");
  const [college, setCollege] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");

  function showMessage(text, messageType) {
    setMessage(text);
    setType(messageType);
  }

  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = setTimeout(() => {
      setMessage("");
      setType("info");
    }, 2000);

    return () => clearTimeout(timer);
  }, [message]);

  const parseDate = (value) => {
    if (!value) return null;

    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const getDuration = (fromDate, toDate) => {
    if (!fromDate || !toDate) {
      return { days: 0, months: 0 };
    }

    const msPerDay = 1000 * 60 * 60 * 24;
    const diffInDays = Math.max(
      0,
      Math.ceil((toDate.getTime() - fromDate.getTime()) / msPerDay) + 1
    );

    return {
      days: diffInDays,
      months: Number((diffInDays / 30).toFixed(1)),
    };
  };

  const getBatchStatus = (batchStartDate, batchEndDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!batchStartDate || !batchEndDate) {
      return "Not Available";
    }

    if (today < batchStartDate) {
      return "Upcoming";
    }

    if (today > batchEndDate) {
      return "Completed";
    }

    return "Active";
  };

  const normalizeBatch = (batch, index = 0) => {
    const startDateValue = String(batch?.startDate || "").trim();
    const endDateValue = String(batch?.endDate || "").trim();
    const parsedStartDate = parseDate(startDateValue);
    const parsedEndDate = parseDate(endDateValue);

    return {
      id: batch?.id ?? Date.now() + index,
      batchName: String(batch?.batchName || batch?.name || batch || "").trim(),
      college: String(batch?.college || "").trim(),
      startDate: startDateValue,
      endDate: endDateValue,
      duration:
        batch?.duration && typeof batch.duration === "object"
          ? {
              days: Number(batch.duration.days) || 0,
              months: Number(batch.duration.months) || 0,
            }
          : getDuration(parsedStartDate, parsedEndDate),
      status:
        String(batch?.status || "").trim() ||
        getBatchStatus(parsedStartDate, parsedEndDate),
    };
  };

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("lms-batches")) || [];
    const normalizedData = (Array.isArray(data) ? data : []).map((batch, index) =>
      normalizeBatch(batch, index)
    );

    setBatches(normalizedData);
    localStorage.setItem("lms-batches", JSON.stringify(normalizedData));
  }, []);

  const parsedStartDate = parseDate(startDate);
  const parsedEndDate = parseDate(endDate);
  const validRange = parsedStartDate && parsedEndDate && parsedEndDate >= parsedStartDate;
  const batchPreview = validRange
    ? {
        duration: getDuration(parsedStartDate, parsedEndDate),
        status: getBatchStatus(parsedStartDate, parsedEndDate),
      }
    : null;

  const handleAdd = () => {
    const trimmedBatchName = batchName.trim();
    const trimmedCollege = college.trim();
    const parsedStartDate = parseDate(startDate);
    const parsedEndDate = parseDate(endDate);

    if (!trimmedBatchName || !trimmedCollege || !startDate || !endDate) {
      showMessage("Please fill in batch name, college, start date, and end date.", "danger");
      return;
    }

    if (!parsedStartDate || !parsedEndDate) {
      showMessage("Please enter valid start and end dates.", "danger");
      return;
    }

    if (parsedEndDate < parsedStartDate) {
      showMessage("End date must be on or after the start date.", "danger");
      return;
    }

    const duration = getDuration(parsedStartDate, parsedEndDate);
    const status = getBatchStatus(parsedStartDate, parsedEndDate);

    const newBatch = {
      id: Date.now(),
      batchName: trimmedBatchName,
      college: trimmedCollege,
      startDate,
      endDate,
      duration,
      status,
    };

    const updated = [...batches, newBatch];
    setBatches(updated);
    localStorage.setItem("lms-batches", JSON.stringify(updated));

    setBatchName("");
    setCollege("");
    setStartDate("");
    setEndDate("");

    showMessage("Batch added successfully", "success");
  };

  const handleDelete = (id) => {
    const updated = batches.filter((b) => b.id !== id);
    setBatches(updated);
    localStorage.setItem("lms-batches", JSON.stringify(updated));

    showMessage("Batch deleted successfully", "success");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleAdd();
  };

  return (
    <div className="container mt-4">
      <div className="card p-3 shadow-sm">
        <h1 className="h4 mb-3">Batch Management</h1>

        {message ? (
          <div className={`alert alert-${type}`} role="alert">
            {message}
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-12 col-md-6 mb-3">
              <label className="form-label">Batch Name</label>
              <input
                type="text"
                className="form-control"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="Enter batch name"
              />
            </div>

            <div className="col-12 col-md-6 mb-3">
              <label className="form-label">College</label>
              <input
                type="text"
                className="form-control"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="Enter college"
              />
            </div>

            <div className="col-12 col-md-6 mb-3">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="col-12 col-md-6 mb-3">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {batchPreview ? (
            <div className="alert alert-info mb-3">
              Duration: {batchPreview.duration.days} days ({batchPreview.duration.months} months) | Status: {batchPreview.status}
            </div>
          ) : null}

          <CustomButton text="Add Batch" onClick={handleSubmit} />
        </form>

        <hr className="my-4" />

        {batches.length === 0 ? (
          <p className="text-muted mb-0">No data available</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-striped align-middle mb-0">
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>College</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th style={{ width: 120 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b.id}>
                    <td>{b.batchName}</td>
                    <td>{b.college || "Not Available"}</td>
                    <td>{b.startDate || "Not Available"}</td>
                    <td>{b.endDate || "Not Available"}</td>
                    <td>
                      {b.duration?.days ?? 0} days ({b.duration?.months ?? 0} months)
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          String(b.status || "").toLowerCase() === "active"
                            ? "bg-success"
                            : String(b.status || "").toLowerCase() === "upcoming"
                            ? "bg-warning text-dark"
                            : "bg-secondary"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td>
                      <CustomButton text="Delete" onClick={() => handleDelete(b.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


