import Fine from '../models/Fine.js';
import HostelAllotment from '../models/HostelAllotment.js';
import Payment from '../models/Payment.js';

// Pay a fine (any department) - student only
export const payFine = async (req, res) => {
  try {
    const { fineId } = req.params;

    const fine = await Fine.findOne({
      _id: fineId,
      student: req.user._id
    });

    if (!fine) {
      return res.status(404).json({ message: 'Fine not found for this student' });
    }

    if (fine.status === 'paid') {
      return res.status(400).json({ message: 'Fine is already paid' });
    }

    // In real world, integrate payment gateway here
    const payment = new Payment({
      student: req.user._id,
      type: 'fine',
      reference: fine._id,
      referenceModel: 'Fine',
      amount: fine.amount,
      status: 'success',
      provider: 'mock'
    });

    await payment.save();

    fine.status = 'paid';
    await fine.save();

    res.status(200).json({
      message: 'Fine paid successfully',
      fine,
      payment
    });
  } catch (error) {
    console.error('Pay fine error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Pay hostel allotment fee - student only
export const payHostelAllotment = async (req, res) => {
  try {
    const { allotmentId } = req.params;
    const { amount } = req.body;

    const allotment = await HostelAllotment.findOne({
      _id: allotmentId,
      student: req.user._id
    }).populate('room');

    if (!allotment) {
      return res.status(404).json({ message: 'Hostel allotment not found for this student' });
    }

    if (allotment.status !== 'approved') {
      return res.status(400).json({ message: 'Only approved allotments can be paid for' });
    }

    if (allotment.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Hostel allotment already paid' });
    }

    const paymentAmount = amount || Number(process.env.HOSTEL_FEE || 5000);

    const payment = new Payment({
      student: req.user._id,
      type: 'hostel_allotment',
      reference: allotment._id,
      referenceModel: 'HostelAllotment',
      amount: paymentAmount,
      status: 'success',
      provider: 'mock'
    });

    await payment.save();

    allotment.paymentStatus = 'paid';
    allotment.payment = payment._id;
    await allotment.save();

    res.status(200).json({
      message: 'Hostel allotment paid successfully',
      allotment,
      payment
    });
  } catch (error) {
    console.error('Pay hostel allotment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


