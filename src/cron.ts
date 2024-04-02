import https from "https";

const backenUrl = "https://todo-list-api-ml1b.onrender.com";
const keepTheServerAlive = () => {
  // console.log("Restarting server");

  https
    .get(backenUrl, (res) => {
      if (res.statusCode === 200) {
        // console.log("Server restarted");
      } else {
        // console.error(
        //   `Failed to restart server with status code: ${res.statusCode}`
        // );
      }
    })
    .on("error", (err) => {
      // console.error("Error during Restart: ", err.message);
    });
};

export default keepTheServerAlive;
