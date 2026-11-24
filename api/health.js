// Vercel Serverless Function: GET /api/health

module.exports = (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Lead Flow Agency Lead Engine'
  });
};
