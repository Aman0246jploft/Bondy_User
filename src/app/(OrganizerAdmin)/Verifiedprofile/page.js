"use client";
import Link from "next/link";
import React, { useState, useRef, useEffect } from "react";
import { Col, Form, Row } from "react-bootstrap";
import "react-datepicker/dist/react-datepicker.css";
import PhoneInput, { parsePhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import apiClient from "../../../api/apiClient";
// import authApi from "../../../api/authApi"; // authApi uses apiClient internally
import authApi from "../../../api/authApi";
import toast from "react-hot-toast";
import { getFullImageUrl } from "../../../utils/imageHelper";

function page() {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [businessDoc, setBusinessDoc] = useState(null);
  const [govIdDoc, setGovIdDoc] = useState(null);
  const [status, setStatus] = useState("unverified"); // unverified, pending, approved, rejected, none

  const fileRefBusiness = useRef(null);
  const fileRefGov = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  const updateProfile = async () => {
    try {
      const payload = {};
      if (email) payload.email = email;

      if (contactNumber) {
        const parsed = parsePhoneNumber(contactNumber);
        if (parsed) {
          payload.countryCode = `+${parsed.countryCallingCode}`;
          payload.contactNumber = parsed.nationalNumber;
        } else {
          payload.contactNumber = contactNumber; // Fallback if not parseable (shouldn't happen with valid PhoneInput)
        }
      }

      const res = await apiClient.post("/user/update-profile", payload);
      if (res.status === 200) {
        toast.success("Profile updated successfully");
        fetchProfile(); // Refresh data
      }
    } catch (error) {
      console.error("Update profile error", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    }
  };

  useEffect(() => {
    if (userData) {
      setEmail(userData.email || "");
      // Construct full number for PhoneInput
      if (userData.contactNumber) {
        setContactNumber(userData.countryCode ? `${userData.countryCode}${userData.contactNumber}` : userData.contactNumber);
      } else {
        setContactNumber("");
      }
    }
  }, [userData]);

  const fetchProfile = async () => {
    try {
      const res = await apiClient.get("/user/selfProfile");
      if (res.data && res.data.user) {
        const profile = res.data.user;
        setUserData(profile);
        setStatus(profile.organizerVerificationStatus || "none");

        if (profile.documents && profile.documents.length > 0) {
          profile.documents.forEach(doc => {
            const docObj = {
              file: doc.file,
              preview: getFullImageUrl(doc.file)
            };
            if (doc.name === "Business Proof") setBusinessDoc(docObj);
            if (doc.name === "Gov ID") setGovIdDoc(docObj);
          });
        }
      }
    } catch (error) {
      console.error("Error fetching profile", error);
    }
  };

  const handleFileChange = async (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("files", file);

    try {
      setLoading(true);
      const res = await authApi.uploadFile(formData);

      if (res.data && res.data.files && res.data.files.length > 0) {
        const fileUrl = res.data.files[0];
        const docObj = {
          file: fileUrl,
          preview: getFullImageUrl(fileUrl)
        };

        if (docType === "Business Proof") setBusinessDoc(docObj);
        if (docType === "Gov ID") setGovIdDoc(docObj);

        toast.success(`${docType} uploaded successfully`);
      }
    } catch (error) {
      console.error("Upload error", error);
      toast.error("Failed to upload document");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Require at least one? Or both? User said "Business Proof , govId". 
    // Let's require at least one for now, or assume both if UI suggests.
    if (!businessDoc && !govIdDoc) {
      toast.error("Please upload at least one document");
      return;
    }

    try {
      setLoading(true);
      const documents = [];
      if (businessDoc) documents.push({ name: "Business Proof", file: businessDoc.file });
      if (govIdDoc) documents.push({ name: "Gov ID", file: govIdDoc.file });

      const payload = { documents };

      const res = await apiClient.post("/verification/submit", payload);
      if (res.status === 200) {
        toast.success("Verification submitted successfully");
        setStatus("pending");
      }
    } catch (error) {
      console.error("Submit error", error);
      toast.error(error.response?.data?.message || "Failed to submit verification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Row className="justify-content-center">
        <Col md={6}>
          <Form className="row" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <div className="event-form-card">
              <h4 className="mb-4 text-white">Organizer Verification</h4>

              {status === "approved" && (
                <div className="alert alert-success">
                  Your account is verified!
                </div>
              )}

              {status === "rejected" && (
                <div className="alert alert-danger">
                  Your verification was rejected. Please re-upload valid documents.
                </div>
              )}

              {status === "pending" && (
                <div className="alert alert-warning">
                  Your verification is pending approval.
                </div>
              )}

              <Row>
                <Col md={12}>
                  <div className="event-frm-bx">
                    <label className="text-white mb-2">Government ID</label>
                    <div
                      className="doc_upload_sec mt-0"
                      onClick={() => status !== "approved" && fileRefGov.current.click()}
                      style={{ cursor: status === "approved" ? "default" : "pointer", opacity: status === "approved" ? 0.7 : 1 }}
                    >
                      <div className="photo_circle">
                        {govIdDoc ? (
                          <img
                            src={govIdDoc.preview}
                            alt="Preview"
                            className="preview-img"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }}
                          />
                        ) : (
                          <div className="upload-doc">
                            Upload Gov ID
                            <p>
                              Drag and drop or browse to upload
                            </p>
                            <span className="add_photo_text">
                              Upload Photo
                            </span>
                          </div>
                        )}
                      </div>

                      <input
                        type="file"
                        accept="image/*"
                        ref={fileRefGov}
                        style={{ display: "none" }}
                        onChange={(e) => handleFileChange(e, "Gov ID")}
                        disabled={status === "approved"}
                      />
                    </div>
                  </div>
                </Col>

                <Col md={12}>
                  <div className="event-frm-bx mb-3">
                    <label className="text-white mb-1">Email</label>
                    <div className="d-flex gap-2">
                      <input
                        type="email"
                        className="form-control"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </Col>
                <Col md={12}>
                  <div className="event-frm-bx mb-3">
                    <label className="text-white mb-1">Contact Number</label>
                    <div className="d-flex gap-2 custom-tel-input">
                      <PhoneInput
                        defaultCountry="US"
                        international
                        countryCallingCodeEditable={false}
                        value={contactNumber}
                        onChange={setContactNumber}
                        className="form-control"
                      />
                      <button type="button" className="btn btn-primary btn-sm" onClick={updateProfile}>Update</button>
                    </div>
                  </div>
                </Col>

                <Col md={12}>
                  <div className="event-frm-bx">
                    <label className="text-white mb-2">Business Document (Proof of Business)</label>
                    <div
                      className="doc_upload_sec mt-0"
                      onClick={() => status !== "approved" && fileRefBusiness.current.click()}
                      style={{ cursor: status === "approved" ? "default" : "pointer", opacity: status === "approved" ? 0.7 : 1 }}
                    >
                      <div className="photo_circle">
                        {businessDoc ? (
                          <img
                            src={businessDoc.preview}
                            alt="Preview"
                            className="preview-img"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }}
                          />
                        ) : (
                          <div className="upload-doc">
                            Upload Business Document
                            <p>
                              Drag and drop or browse to upload
                            </p>
                            <span className="add_photo_text">
                              Upload Photo
                            </span>
                          </div>
                        )}
                      </div>

                      <input
                        type="file"
                        accept="image/*"
                        ref={fileRefBusiness}
                        style={{ display: "none" }}
                        onChange={(e) => handleFileChange(e, "Business Proof")}
                        disabled={status === "approved"}
                      />
                    </div>
                  </div>
                </Col>
              </Row>

              {status !== "approved" && (
                <div className="d-flex gap-2 justify-content-end mt-4">
                  <button
                    type="submit"
                    className="custom-btn"
                    disabled={loading || (!businessDoc && !govIdDoc)}
                  >
                    {loading ? "Submitting..." : "Submit for Verification"}
                  </button>
                </div>
              )}

              {/* Document History / Status List */}
              {userData?.documents?.length > 0 && (
                <div className="mt-5">
                  <h5 className="text-white mb-3">Uploaded Documents</h5>
                  <div className="table-responsive">
                    <table className="table table-dark table-striped">
                      <thead>
                        <tr>
                          <th>Document Name</th>
                          <th>Status</th>
                          <th>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userData.documents.map((doc, index) => (
                          <tr key={index}>
                            <td>
                              <a href={getFullImageUrl(doc.file)} target="_blank" rel="noopener noreferrer" className="text-info">
                                {doc.name}
                              </a>
                            </td>
                            <td>
                              <span className={`badge ${doc.status === 'approved' ? 'bg-success' :
                                doc.status === 'rejected' ? 'bg-danger' : 'bg-warning'
                                }`}>
                                {doc.status.toUpperCase()}
                              </span>
                            </td>
                            <td>{doc.reason || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          </Form>
        </Col>
      </Row>
    </div>
  );
}

export default page;
