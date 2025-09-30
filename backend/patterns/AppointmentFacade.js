const PetModel = require("../models/Pet");
const appointmentService = require("../services/appointmentService");



// Facade sub system
class PetChecker {
    async check(petId) {
        if (!petId) throw new Error("petId is required.");
        const pet = await PetModel.findById(petId).lean();
        if (!pet) throw new Error("Pet not found.");
        return pet;
    }
}

class UserValidator {
    validate(user) {
        logger.info("User Validator: Validating user");
        if (!user?.id) throw new Error("Invalid user.");
        return true;
    }
}

//DB

class AppointmentCreator {
    async create(appointmentData, currentUser) {
        logger.info("Appointment Creator: Creating appointment");
        const appointment = await appointmentService.createAppointment({
            ...appointmentData,
            userId: currentUser.id,
        });
        logger.info("Appointment Creator: Appointment saved");
        return appointment;
    }
}


// ========== FACADE  ==========
class AppointmentFacade {
    constructor() {
        this.petChecker = new PetChecker();
        this.userValidator = new UserValidator();
        this.appointmentCreator = new AppointmentCreator();
        this.notificationSender = new NotificationSender();
    }

    async createCompleteAppointment(appointmentData, currentUser) {
        logger.info("\nStarting Complete Appointment Process...");

        // PetCheck(=>TV function)
        this.petChecker.check(appointmentData.petId);

        // User validation (=> SoundSystem)
        this.userValidator.validate(currentUser);

        // appointmnet (=>Lights)
        const appointment = await this.appointmentCreator.create(appointmentData, currentUser);
        
        // Observer notification sender (=>AC)
        this.notificationSender.send(appointment);

        logger.info("Appointment process completed! 🎉\n");

        return {
            success: true,
            appointment: appointment,
            userId: String(appointment.userId._id),
            petId: String(appointment.petId._id),
            owner: appointment.petId.owner,
            message: "Appointment created and notifications sent!"
        };
    }
}

module.exports = { facade };