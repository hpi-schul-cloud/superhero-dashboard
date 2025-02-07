const sendFile = async (req, res, next, api) => {
  const { fileContent, batchTitle } = req.body;
  const targetRefIds = fileContent.split("\n").map((item) => item.trim());
  try {
    const response = await api(req, { adminApi: true }).post(
      "/deletion-batches/",
      {
        json: {
          name: batchTitle,
          targetRefDomain: "domain",
          targetRefIds,
        },
      }
    );
    // todo: React to certain responses
    console.log(response);

    res.status(200).send({ message: "File sent successfully" });
  } catch (error) {
    console.log("error: ", error.statusCode);
    next(error);
  }
};

module.exports = sendFile;