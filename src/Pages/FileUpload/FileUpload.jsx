//React code to upload a file to the server from the user's computer
import React from "react";
import styles from "./FileUpload.module.css";
import axios from "axios";
import { useState, useEffect } from "react";
import Papa from "papaparse";
import { useTimeout, useToast } from "@chakra-ui/react";
import EmailPreview from "../../Components/EmailPreview/EmailPreview";
import { FaInstagram, FaTwitter, FaGithub, FaTelegram } from "react-icons/fa";
import { AiFillInfoCircle } from "react-icons/ai";
import ReportPage from "../ReportPage/ReportPage";
import HelpPage from "../HelpPage/HelpPage";

const FileUpload = () => {
  const [fromMail, setFromMail] = useState("");
  const [password, setPassword] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [subject, setSubject] = useState("");
  const [files, setFiles] = useState([]);
  const [file, setFile] = useState();
  const [confirm, setConfirm] = useState(false);

  const [successCSV, setSuccessCSV] = useState([]);
  const [failureCSV, setFailureCSV] = useState([]);

  const [failureList, setFailureList] = useState([]);
  const [successList, setSuccessList] = useState([]);

  const [viewReport, setViewReport] = useState(false);
  const [viewHelp, setViewHelp] = useState(false);
  const [stopMails, setStopMails] = useState(false);

  const [sampleEmail, setSampleEmail] = useState({
    fromMail: "",
    subject: "",
    emailContent: "",
    attachments: [],
  });

  const [csvData, setCsvData] = useState([]);

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const handleEmailPreview = () => {
    setIsEmailModalOpen(true);
  };

  const handleCloseEmailModal = () => {
    setIsEmailModalOpen(false);
  };

  const toast = useToast();

  const handleCsvUpload = (event) => {
    const file = event.target.files[0];

    Papa.parse(file, {
      header: true,
      complete: (result) => {
        result.data.forEach(function (obj) {
          var new_obj = {};
          Object.keys(obj).forEach(function (key) {
            new_obj[key.toLowerCase()] = obj[key];
          });
          Object.keys(obj).forEach(function (key) {
            delete obj[key];
          });
          Object.assign(obj, new_obj);
        });

        //loop throught result.data and check if all values are present and not empty string or undefined and to a variable data

        var data_ = result.data.filter((obj) => {
          return !Object.values(obj).every(
            (value) => value === "" || value === undefined
          );
        });
        setCsvData(data_);
      },
    });
  };

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    setFiles(selectedFiles);
  };

  const makeContent = (obj) => {
    let updatedText = emailContent;
    const placeholders = emailContent.match(/{{\w+}}/g);

    if (placeholders) {
      placeholders.forEach((placeholder) => {
        const propName = placeholder
          .substring(2, placeholder.length - 2)
          .toLowerCase();

        updatedText = updatedText.replace(placeholder, obj[propName] || "");
      });
    }
    return updatedText;
  };

  const selectAttachment = (obj) => {
    const attachmentNames = Object.keys(obj).filter(
      (key) => key.startsWith("attachment") && obj[key] !== ""
    );
    const attachments = attachmentNames.map(
      (attachmentName) =>
        files.find((file) => file.name === obj[attachmentName]) || null
    );

    return attachments.filter((attachment) => attachment !== null);
  };

  const handlePreview = (e) => {
    setSampleEmail((prevState) => ({
      ...prevState,
      fromMail: fromMail,
      subject: subject,
      emailContent: makeContent(csvData[0]),
      attachments: selectAttachment(csvData[0]),
    }));

    handleEmailPreview();
  };

  useEffect(() => {
    let shouldStop = false;
    if (confirm) {
      setViewReport(true);
      console.log(stopMails);
      csvData.map((obj, index) => {
        if (!stopMails) {
          setTimeout(() => {
            if (!shouldStop) {
              console.log(stopMails);
              const data = new FormData();
              console.log("Test");
              console.log(csvData);
              data.append("fromMail", fromMail)
              data.append("password", password);
              data.append("to", obj.email);
              data.append("subject", subject);
              data.append("content", makeContent(obj));

              const files = selectAttachment(obj);

              files.forEach((file) => {
                data.append("mailAttachment", file);
              });

              const config = {
                method: "post",
                maxBodyLength: Infinity,
                url: "http://127.0.0.1:8000/mailman/v1/send-mail/",
                headers: { "Content-Type": "multipart/form-data" },
                data: data,
              };

              axios(config)
                .then(function (response) {
                  if (!response.data.hasError) {
                    //update the success number in the state variable
                    setSuccessList((successList) => [
                      ...successList,
                      response.data.recipient,
                    ]);
                    setSuccessCSV((successCSV) => [...successCSV, obj]);
                  } else {
                    setFailureList((failureList) => [
                      ...failureList,
                      response.data.recipient,
                    ]);
                    console.log(response.data);
                    setFailureCSV((failureCSV) => [...failureCSV, obj]);

                    if (response.data.statusCode === 1001) {
                      shouldStop = true;
                      for (let i = index + 1; i < csvData.length; i++) {
                        setFailureList((failureList) => [
                          ...failureList,
                          csvData[i].email,
                        ]);
                        console.log(response.data);
                        setFailureCSV((failureCSV) => [
                          ...failureCSV,
                          csvData[i],
                        ]);
                      }

                      toast({
                        title: "Mail Senting Failed! Try Again Later",
                        status: "error",
                        duration: 3000,
                        isClosable: true,
                      });
                    }
                  }
                })
                .catch(function (error) {
                  console.log(error);
                  setFailureList((failureList) => [...failureList, obj.email]);
                  console.log(response.data);
                  setFailureCSV((failureCSV) => [...failureCSV, obj]);
                })
                .finally(function () {});
            }
          }, index * 2000);
        }
      });
    }

    toast({
      title: "We only support gmail for now",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
    toast({
      title: "Make sure to use your App Password as password",
      description: "Always reset your App Password after use",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  }, [confirm]);
  return !viewReport ? (
    <div className={styles.background_container}>
      <>
        <EmailPreview
          isOpen={isEmailModalOpen}
          onClose={handleCloseEmailModal}
          email={sampleEmail}
          setConfirm={setConfirm}
          confirm={confirm}
        />

        <div className={styles.main_container}>
          <div className={styles.navbar}>
            <div className={styles.logo}>
              <p>MailMan</p>
              <iframe
                src="https://ghbtns.com/github-btn.html?user=BuildNShip&repo=mailman-frontend&type=star&count=true&size=large"
                width="70"
                height="30"
                title="GitHub"
              ></iframe>
            </div>

            <a
              href="https://www.producthunt.com/posts/mailman-a3c14988-8f3b-4d97-9f19-2a3b21353002?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-mailman&#0045;a3c14988&#0045;8f3b&#0045;4d97&#0045;9f19&#0045;2a3b21353002"
              target="_blank"
            >
              <img
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=400162&theme=dark"
                alt="MailMan - One&#0032;click&#0044;&#0032;many&#0032;mails | Product Hunt"
                // style="width: 250px; height: 54px;"
                height="44"
              />
            </a>
          </div>
          <div className={styles.top_header}>
            <div className={styles.creds}>
              <input
                onChange={(event) => {
                  setFromMail(event.target.value);
                }}
                type="email"
                value={fromMail}
                required
                placeholder="Enter Your Email Address"
              />

              <input
                onChange={(event) => {
                  setPassword(event.target.value);
                }}
                value={password}
                type="password"
                required
                placeholder="Enter Your Email App Password"
              />
              <button
                onClick={() => {
                  //check whether the email and password are valid or not and there is a mail subject and content and the state variables are not empty
                  if (!file) {
                    toast({
                      title: "Upload CSV",
                      status: "error",
                      duration: 3000,
                      position: "top-right",
                      isClosable: true,
                    });
                  } else if (
                    fromMail === "" ||
                    password === "" ||
                    subject === "" ||
                    emailContent === ""
                  ) {
                    //give a toast message unqiue to each of the above cases
                    toast.closeAll();
                    toast({
                      title: "Please fill all the fields",
                      status: "error",
                      duration: 3000,
                      position: "top-right",
                      isClosable: true,
                    });
                  } else if (
                    !fromMail.match(
                      //using regex validate the email pattern
                      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
                    )
                  ) {
                    toast.closeAll();
                    toast({
                      title: "Please enter a valid email",
                      status: "error",
                      duration: 3000,
                      position: "top-right",
                      isClosable: true,
                    });
                  } else {
                    //using regex validate the email pattern ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$

                    handlePreview();
                  }
                }}
                className={styles.sent_mail}
              >
                Sent Mails
              </button>
            </div>
            <div className={styles.subject_row}>
              <input
                onChange={(event) => {
                  setSubject(event.target.value);
                }}
                type="text"
                value={subject}
                required
                placeholder="This is the subject of the mail"
              />
            </div>
          </div>
          <div className={styles.mail_body}>
            <textarea
              className={styles.mail_content}
              onChange={(event) => {
                setEmailContent(event.target.value);
              }}
              value={emailContent}
              placeholder="You can enter the content of the mail here, we do support dynamic content. You could use the following syntax to add dynamic content {{column_name}}. For example, if you want to add the name of the person in the mail, you could use {{name}}. The column name should be the same as the column name in the CSV file."
              required
            />
            <div className={styles.attachments}>
              <p className={styles.attachment_label}>Select the CSV File</p>
              <input
                type="file"
                id="file1"
                name="file1"
                onChange={(e) => {
                  setFile(e.target.files[0]);
                  handleCsvUpload(e);
                  document.getElementById("file1_label").textContent =
                    e.target.files[0].name;
                }}
                required
              />
              <label htmlFor="file1" id="file1_label">
                Choose File
              </label>
              <a href="https://drive.google.com/uc?export=download&id=16lqXzlrcTD5RSDYStyKX7ila3YwZjkSL">
                {" "}
                <p className={styles.download_template}>
                  Download the sample CSV file{" "}
                </p>
              </a>
            </div>
            <div className={styles.attachments}>
              <p className={styles.attachment_label}>
                Select all the mail Attachments
              </p>
              <input
                type="file"
                id="file2"
                name="file2"
                multiple
                onChange={(e) => {
                  handleFileChange(e);
                  const fileNames = Array.from(e.target.files)
                    .map((file) => file.name)
                    .join(", ");
                  document.getElementById("file2_label").textContent =
                    fileNames;
                }}
              />
              <label htmlFor="file2" id="file2_label">
                Choose Multiple Files
              </label>
            </div>
          </div>
        </div>
        <div className={styles.button_container}>
          <button
            onClick={() => {
              setViewHelp(true);
              setViewReport(true);
            }}
            className={styles.round_button}
          >
            <AiFillInfoCircle size={50} color="#2ba6a6" />
          </button>
        </div>
        <div className={styles.footer}>
          <a href="https://buildnship.in/">
            <img src="/BuildNShip.png" alt="logo" />
          </a>
          <div className={styles.social_container}>
            <a href="https://twitter.com/buildnship/">
              <FaTwitter size={25} />
            </a>
            <a href="https://instagram.com/buildnship?igshid=YmMyMTA2M2Y=">
              <FaInstagram size={25} />
            </a>
            <a href="https://github.com/BuildNShip">
              <FaGithub size={25} />
            </a>
            <a href="https://t.me/buildnship">
              <FaTelegram size={25} />
            </a>
          </div>
        </div>
      </>
    </div>
  ) : viewHelp ? (
    <HelpPage setViewReport={setViewReport} setViewHelp={setViewHelp} />
  ) : (
    <ReportPage
      csvData={csvData}
      totalNumber={csvData.length}
      successList={successList}
      failureList={failureList}
      successCSV={successCSV}
      failureCSV={failureCSV}
    />
  );
};

export default FileUpload;
