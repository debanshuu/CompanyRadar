const mongoose = require('mongoose');

const searchSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  analysis: {
    summary: String,
    swot: {
      strengths: [String],
      weaknesses: [String],
      opportunities: [String],
      threats: [String]
    },
    competitors: [String],
    growth_opportunities: [String],
    risk_assessment: String,
    ticker: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Search', searchSchema);