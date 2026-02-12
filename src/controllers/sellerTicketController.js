// controllers/sellerTicketController.js
const { Ticket } = require("../models");

exports.getSellerTickets = async (req, res) => {
  try {
    const tickets = await Ticket.findAll({
      where: { seller_id: req.user.sub },
      order: [["created_at", "DESC"]],
    });

    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.createSellerTicket = async (req, res) => {
  try {
    const { type, subject, message } = req.body;

    if (!type || !subject || !message) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const ticket = await Ticket.create({
      seller_id: req.user.sub,
      type,
      subject,
      message,
    });

    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
