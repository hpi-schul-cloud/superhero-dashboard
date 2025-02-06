const sendFile = async (req, res, next, api) => {
    const { fileContent, batchTitle } = req.body;
    console.log("batchTitle: ", batchTitle);
    const targetRefIds = fileContent.split("\n").map((item) => item.trim());
    console.log("targetRefIds: ", targetRefIds);
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
    } catch (error) {
      console.log("error: ", error.statusCode);
      next(error);
    }
  
    res.redirect(303, "/batch-deletion/");
    };

    module.exports = sendFile;