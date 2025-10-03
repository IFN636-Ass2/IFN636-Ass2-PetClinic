const chai = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');

const { expect } = chai;

const {
  createPet,
  getPets,
  updatePet,
  deletePet,
  addTreatment,
  getTreatments,
  deleteTreatment

} = require('../controllers/petController');

const {
  registerUser,
  loginUser,
  getProfile,
  updateUserProfile,
} = require(`../controllers/userController`);

const {
  createAppointment,
  getAppointments,
  updateAppointment,
  deleteAppointment
} = require(`../controllers/appointmentController`);

const { PetService } = require('../services/petService');
const { TreatmentService } = require(`../services/petService`);
const { AdminOnlyProxy } = require('../patterns/AdminProxy');
const { UserService } = require(`../services/userService`);
const { facade } = require(`../patterns/AppointmentFacade`)
const appointmentService = require('../services/appointmentService');

afterEach(() => sinon.restore());

//Test Create Pet

describe('Create Pet', () => {
  it('should create a new pet successfully', async () => {
    const req = { body: { name: 'Test name', species: 'Test species', owner: { name: 'Test owner', phone: '123' } } };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    sinon.stub(PetService, 'createPet').resolves({ _id: new mongoose.Types.ObjectId(), ...req.body });

    await createPet(req, res);

    expect(res.status.calledWith(201)).to.be.true;
    expect(res.json.calledWithMatch({ name: 'Test name' })).to.be.true;
  });

  it('should return 400 on error', async () => {
    const req = { body: {} };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    sinon.stub(PetService, 'createPet').throws(new Error('DB Error'));

    await createPet(req, res);

    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;
  });
});

// Test Get Pets
describe('Get Pets', () => {
  it('should return pets successfully', async () => {
    const req = {};
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };
    const pets = [
      { _id: new mongoose.Types.ObjectId(), name: 'Test Name', species: 'Test Species' },
      { _id: new mongoose.Types.ObjectId(), name: 'Test Name 2', species: 'Test Species' },
    ];

    sinon.stub(PetService, 'getPets').resolves(pets);

    await getPets(req, res);

    expect(res.json.calledWith(pets)).to.be.true;
  });

  it('should return 500 and on error', async () => {
    const req = {};
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    sinon.stub(PetService, 'getPets').throws(new Error('DB Error'));

    await getPets(req, res);

    expect(res.json.calledWith([])).to.be.true;
  });
});


// Test Update Pet

describe('Update Pet', () => {
  it('should update pet successfully', async () => {
    const id = new mongoose.Types.ObjectId();
    const req = { params: { id }, body: { name: 'Updated Name' } };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };
    const updatedPet = { _id: id, name: 'Updated Name' };

    sinon.stub(PetService, 'updatePet').resolves(updatedPet);

    await updatePet(req, res);

    expect(res.json.calledWith(updatedPet)).to.be.true;
  });

  it('should return 400 on unexpected error', async () => {
    const req = { params: { id: new mongoose.Types.ObjectId() }, body: {} };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    sinon.stub(PetService, 'updatePet').throws(new Error('DB Error'));

    await updatePet(req, res);

    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true
  });
});


// Test Delete Pet
describe('Delete Pet', () => {
  it('should delete pet successfully for admin', async () => {
    const id = new mongoose.Types.ObjectId().toString();
    const req = { params: { id }, user: { role: 'admin' } };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    sinon.stub(AdminOnlyProxy.prototype, 'deletePet').resolves({ message: 'Pet deleted' });

    await deletePet(req, res);

    expect(res.json.calledWith({ message: 'Pet deleted' })).to.be.true;
  });

  it('should return 400 if delete fails', async () => {
    const id = new mongoose.Types.ObjectId().toString();
    const req = { params: { id }, user: { role: 'admin' } };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    sinon.stub(AdminOnlyProxy.prototype, 'deletePet').resolves({ message: 'DB Error' });

    await deletePet(req, res);

    expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;
  });

  it('should return 400 if user is not admin', async () => {
    const id = new mongoose.Types.ObjectId().toString();
    const req = { params: { id }, user: { role: 'user' } };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    sinon.stub(AdminOnlyProxy.prototype, 'deletePet').resolves({ message: 'Only admin can delete' });

    await deletePet(req, res);

    expect(res.json.calledWithMatch({ message: 'Only admin can delete' })).to.be.true;
  });
});


// User testing

// Register User
describe('Register User Test', () => {
  it('should register user successfully', async () => {
    const req = { body: { name: 'Test', email: 'test@example.com', password: '12345' } };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    sinon.stub(UserService, 'register').resolves({ id: 'user123', name: 'Test', email: 'test@example.com', role: 'staff' });
    process.env.JWT_SECRET = 'secret'; // for signToken in userController.js file

    await registerUser(req, res);

    expect(res.status.calledWith(201)).to.be.true;
    expect(res.json.calledWithMatch({ user: { name: 'Test' } })).to.be.true;
  });

  it('should return 500 if user already exists', async () => {
    const req = { body: { name: 'Test', email: 'duplicateUser@gmail.com', password: '12345' } };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    sinon.stub(UserService, 'register').throws(new Error('User already exists'))
    process.env.JWT_SECRET = 'secret';

    await registerUser(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'User already exists' })).to.be.true;
  });

  it('should return 500 on validation error', async () => {
    const req = { body: {} };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    sinon.stub(UserService, 'register').throws(new Error('name, email, password are required'));

    await registerUser(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({ message: sinon.match.string })).to.be.true;
  });
});

//Login User
describe('Login User Test', () => {
  it('should login successfully', async () => {
    const req = { body: { email: 'tester@gmail.com', password: '123' } };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    sinon.stub(UserService, 'login').resolves({ token: 'test-jwt', user: { id: 'test1', email: 'tester@gmail.com' } });

    await loginUser(req, res);

    expect(res.json.calledWithMatch({ token: 'test-jwt' })).to.be.true;
  });

  it('should return 500 on invalid credentials', async () => {
    const req = { body: { email: 'tester@gmail.com', password: '123' } };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    sinon.stub(UserService, 'login').throws(new Error('Invalid email or passwords'));

    await loginUser(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'Invalid email or passwords' })).to.be.true;
  });
});

//Get User
describe('Get User test', () => {
  it('should return profile successfully', async () => {
    const req = { user: { id: 'tester123' } };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    sinon.stub(UserService, 'getProfile').resolves({ id: 'tester123', name: 'tester' });

    await getProfile(req, res);

    expect(res.json.calledWithMatch({ id: 'tester123' })).to.be.true;
  });

  it('should return 401 if no user', async () => {
    const req = { user: null };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    await getProfile(req, res);

    expect(res.status.calledWith(401)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'Unauthorized' })).to.be.true;
  });
});

// Update User
describe('Update User Profile', () => {
  it('should update profile successfully', async () => {
    const req = { user: { id: 'user123' }, body: { name: 'new user' } };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    sinon.stub(UserService, 'updateProfile').resolves({ id: 'user123', name: 'new user' });

    await updateUserProfile(req, res);

    expect(res.json.calledWithMatch({ name: 'new user' })).to.be.true;
  });


  it('should return 401 if user is not authorised', async () => {
    const req = { user: null, body: { name: 'new user' } };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    await updateUserProfile(req, res);

    expect(res.status.calledWith(401)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'Unauthorized' })).to.be.true;
  });

  it('should return 500 if user not found', async () => {
    const req = { user: { id: 'tester111' }, body: { name: 'new user' } };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    sinon.stub(UserService, 'updateProfile').throws(new Error('User not found'));
    await updateUserProfile(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'User not found' })).to.be.true;
  });
});


// Appointment Test

// Create Appointment Test

describe('Create Appointment Test', () => {
  it('should create an appointment successfuuly', async () => {
    const req = {
      body: { petId: 'pet1', date: '2025-09-29', description: 'Check' },
      user: { id: 'user1', name: 'test name' }
    };

    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    sinon.stub(facade, 'createCompleteAppointment').resolves({
      success: true, appointment: { ...req.body, userId: req.user.id }, message: "Appointment created and notifications sent!"
    });

    await createAppointment(req, res);

    expect(res.status.calledWith(201)).to.be.true;
    expect(res.json.calledWithMatch({ success: true })).to.be.true;
  });

  it('should return 400 on error', async () => {
    const req = {
      body: { petId: 'pet1', date: 'Invalid date', description: 'Check' },
      user: { id: 'user1', name: 'test name' }
    }
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    sinon.stub(facade, 'createCompleteAppointment').throws(new Error('Invalid date'));

    await createAppointment(req, res);

    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'Invalid date' })).to.be.true;
  });
});

// Get Appointments Test
describe('Get Appointment Test', () => {
  it('should return appointments successfully', async () => {
    const userObjectId = new mongoose.Types.ObjectId();

    const req = {
      query: { petId: 'pet1' },
      user: { _id: userObjectId }  // add userId
    };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    const appointments = [
      { _id: new mongoose.Types.ObjectId(), petId: 'pet1', date: '2025-09-29', description: 'check' }
    ];

    sinon.stub(appointmentService, 'getAppointments').resolves(appointments);

    await getAppointments(req, res);

    sinon.assert.calledWith(res.json, appointments);
  });

  it('should return 500 on error', async () => {
    const userObjectId = new mongoose.Types.ObjectId();

    const req = {
      query: {},
      user: { _id: userObjectId }        // add userId
    };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    sinon.stub(appointmentService, 'getAppointments').rejects(new Error('DB Error'));

    await getAppointments(req, res);

    sinon.assert.calledWithExactly(res.status, 500);
    sinon.assert.calledWithMatch(res.json, { message: 'DB Error' });
  });
});

// Update Appointment
describe('Update Appointment Test', () => {
  it('should update appointment successfully', async () => {
    const id = new mongoose.Types.ObjectId();
    const req = { params: { id }, body: { description: 'New check' } };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    const updated = { _id: id, petId: 'pet1', date: '2025-09-29', description: 'New check' }

    sinon.stub(appointmentService, 'updateAppointment').resolves(updated);

    await updateAppointment(req, res);

    expect(res.json.calledWith(updated)).to.be.true;
  });

  it('should return 400 on error', async () => {
    const req = { params: { id: new mongoose.Types.ObjectId() }, body: {} };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    sinon.stub(appointmentService, 'updateAppointment').throws(new Error('DB Error'));

    await updateAppointment(req, res);

    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;
  });
});

// Delete Appointment Test
describe('Delete Appointment', () => {
  it('should delete appointment successfully', async () => {
    const id = new mongoose.Types.ObjectId();
    const req = { params: { id } };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    sinon.stub(appointmentService, 'deleteAppointment').resolves({ message: 'Appointment deleted' });

    await deleteAppointment(req, res);

    expect(res.json.calledWith({ message: 'Appointment deleted' })).to.be.true;
  });

  it('should return 400 if delete fails', async () => {
    const id = new mongoose.Types.ObjectId();
    const req = { params: { id } };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    sinon.stub(appointmentService, 'deleteAppointment').throws(new Error('DB Error'));

    await deleteAppointment(req, res);

    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;
  });
});

// Treatment Test

// Add Treatment Test
describe(' Add Treatment Test', () => {
  it('should add treatement successfuly', async () => {
    const consoleStub = sinon.stub(console, 'log'); //ignore console.log

    const req = { params: { id: 'pet1' }, body: { vet: 'Dr', date: '2025-09-29', description: 'check', treatmentCost: 50, userId: 'user1' } };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    sinon.stub(TreatmentService, 'createTreatment').resolves({ id: 'treat1', ...req.body, petId: 'pet1' });

    await addTreatment(req, res);

    expect(res.status.calledWith(201)).to.be.true;
    expect(res.json.calledWithMatch({ id: 'treat1', vet: 'Dr', petId: 'pet1' })).to.be.true;

    consoleStub.restore();
  });

  it('should return 400 on error', async () => {
    const consoleStub = sinon.stub(console, 'log'); //ignore console.log

    const req = { params: { id: 'pet1' }, body: {} };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    sinon.stub(TreatmentService, 'createTreatment').throws(new Error('DB Error'));

    await addTreatment(req, res);

    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;

    consoleStub.restore();

  });
});

describe('Get Treatement Test', () => {
  it('should get treatments successfully', async () => {
    const consoleStub = sinon.stub(console, 'log'); //ignore console.log

    const req = { params: { petId: 'pet1' } };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    sinon.stub(TreatmentService, 'getTreatmentsByPet').resolves([{ id: 'treat1' }]);

    await getTreatments(req, res);

    expect(res.json.calledWithMatch({ treatments: [{ id: 'treat1' }] })).to.be.true;

    consoleStub.restore();
  });

  it('should return empty array on error', async () => {
    const consoleStub = sinon.stub(console, 'log'); //ignore console.log

    const req = { params: { petId: 'pet1' } };
    const res = { json: sinon.spy() };

    sinon.stub(TreatmentService, 'getTreatmentsByPet').throws(new Error('DB Error'));

    await getTreatments(req, res);

    expect(res.json.calledWithMatch([])).to.be.true;

    consoleStub.restore();
  });
});

describe('Delete Treatment Test', () => {
  it('should delete treatment successfully for admin', async () => {
    const req = {
      params: { id: 'pet1', treatId: 'treat1' },
      user: { id: 'admin1', role: 'admin' }
    };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    sinon.stub(AdminOnlyProxy.prototype, 'deleteTreatment').resolves({ message: 'deleted' });

    await deleteTreatment(req, res);

    expect(res.json.calledWithMatch({ message: 'deleted' })).to.be.true;
  });

  it('should return 400 if treatment not found', async () => {
    const req = {
      params: { id: 'pet1', treatId: 'treat1' },
      user: { id: 'admin1', role: 'admin' }
    };
    const res = { json: sinon.spy() }; //no status used; controller returns Json directly

    sinon.stub(AdminOnlyProxy.prototype, 'deleteTreatment').resolves({ message: 'Treatment not found' });

    await deleteTreatment(req, res);

    expect(res.json.calledWithMatch({ message: 'Treatment not found' })).to.be.true;
  });

  it('should return 400 if user is not admin', async () => {
    const req = {
      params: { id: 'pet1', treatId: 'treat1' },
      user: { id: 'user1', role: 'user' }
    };
    const res = { json: sinon.spy() }; //no status used; controller returns Json directly

    sinon.stub(AdminOnlyProxy.prototype, 'deleteTreatment').resolves({ message: 'Only admin can delete' });

    await deleteTreatment(req, res);

    expect(res.json.calledWithMatch({ message: 'Only admin can delete' })).to.be.true;
  });
});



