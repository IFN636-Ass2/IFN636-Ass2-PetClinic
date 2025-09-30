class AppointmentEntity {
  // constructor
  constructor({_id = null, userId, petId, date, description = ""}) {

    // validate required fields
    if (!userId || !petId || !date) {
      throw new Error("userId, petId, date are required");
    }


