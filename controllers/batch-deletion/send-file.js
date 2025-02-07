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
    res.status(200).send({ message: "File sent successfully" });
  } catch (error) {
    res.status(error.statusCode).send({ message: "Error sending file" });
    next(error);
  }
};

module.exports = sendFile;