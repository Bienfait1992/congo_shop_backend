export async function createPayment(req, res) {
  try {
    const payment = await processPayment(
      req.body,
      req.userId //ajouté
    );

    res.status(201).json({
      message: "Paiement effectué",
      data: payment
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}