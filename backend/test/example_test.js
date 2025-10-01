const chai = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');

const Pet = require('../models/Pet');
const {
  createPet,
  getPets,
  updatePet,
  addTreatment,
    getTreatments,
    deleteTreatment
} = require('../controllers/petController');

const { expect } = chai;

afterEach(() => sinon.restore());

// Test Create Pet
describe('Test Create Pet', () => {
  it('Should create a new pet successfully', async () => {
    const req = {
      body: {
        name: 'Test Name',
        age: 2,
        gender: 'Male',
        species: 'Test Species',
        breed: 'Test Breed',
        owner: { name: 'Tester', phone: '0123456789', email: 'tester@example.com' },
      },
    };

    const created = { _id: new mongoose.Types.ObjectId(), ...req.body };

    const findOneStub = sinon.stub(Pet, 'findOne').resolves(null);
    const createStub  = sinon.stub(Pet, 'create').resolves(created);

    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    await createPet(req, res);

    expect(findOneStub.calledOnceWith({ name: 'Test Name' })).to.be.true;
    expect(createStub.calledOnceWith({
        name: 'Test Name',
        age: 2,
        gender: 'Male',
        species: 'Test Species',
        breed: 'Test Breed',
        owner: { name: 'Tester', phone: '0123456789', email: 'tester@example.com' },
    })).to.be.true;

    expect(res.status.calledWith(201)).to.be.true;
    expect(res.json.calledWith(created)).to.be.true;
  });


  it('should return 500 on error', async () => {
    const req = { body: { name: 'Test Name', species: 'Test Species', owner: { name: 'Tester', phone: '0' } } };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    sinon.stub(Pet, 'findOne').resolves(null);
    sinon.stub(Pet, 'create').throws(new Error('DB Error'));

    await createPet(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;
  });
});

// Test Get Pets
describe('Test Get Pets', () => {
  it('should return pets successfully', async () => {
    const pets = [
      { _id: new mongoose.Types.ObjectId(), name: 'Test Name', species: 'Test Species' },
      { _id: new mongoose.Types.ObjectId(), name: 'Test Name 2', species: 'Test Species' },
    ];
    const req = {};
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    const findStub = sinon.stub(Pet, 'find').resolves(pets);

    await getPets(req, res);

    expect(findStub.calledOnce).to.be.true; // tương thích find() hoặc find({})
    expect(res.status.calledWith(200)).to.be.true;
    expect(res.json.calledWith(pets)).to.be.true;
  });

  it('should return 500 and on error', async () => {
    const req = {};
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    sinon.stub(Pet, 'find').throws(new Error('DB Error'));

    await getPets(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({ error: 'DB Error' })).to.be.true; // controller trả { error }
  });
});

// Test Update Pet
describe('Test Update Pet', () => {
  it('should update pet (no name change)', async () => {
    const id = new mongoose.Types.ObjectId();
    const existing = {
      _id: id,
      name: 'Test Name',
      species: 'Test Species',
      age: 2,
      gender: 'Male',
      owner: { name: 'Ti', phone: '0', email: 'old@example.com' },
      save: sinon.stub(), 
    };

    sinon.stub(Pet, 'findById').resolves(existing);
    sinon.stub(Pet, 'exists');

    const updatedDoc = {
      ...existing,
      age: 3,
      owner: { name: 'Ti', phone: '999', email: 'old@example.com' },
    };
    existing.save.resolves(updatedDoc);

    const req = {
      params: { id },
      body: { name: 'Test Name', age: 3, owner: { phone: '999' } },
    };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    await updatePet(req, res);

    expect(res.status.called).to.be.false;
    expect(res.json.calledWith(updatedDoc)).to.be.true;
  });


  it('should return 404 if pet not found', async () => {
    sinon.stub(Pet, 'findById').resolves(null);
    const req = { params: { id: new mongoose.Types.ObjectId() }, body: {} };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    await updatePet(req, res);

    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWith({ message: 'Pet not found' })).to.be.true;
  });


  it('should return 500 on unexpected error', async () => {
    sinon.stub(Pet, 'findById').throws(new Error('DB Error'));
    const req = { params: { id: new mongoose.Types.ObjectId() }, body: {} };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    await updatePet(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;
  });
});

// Test Delete Pet
describe('Test Delete Pet', () => {
  it('should delete a pet successfully', async () => {
    const id = new mongoose.Types.ObjectId().toString();
    const petDoc = { remove: sinon.stub().resolves() };

    const findByIdStub = sinon.stub(Pet, 'findById').resolves(petDoc);

    const req = { params: { id } };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    await deletePet(req, res);

    expect(findByIdStub.calledOnceWith(id)).to.be.true;
    expect(petDoc.remove.calledOnce).to.be.true;
    expect(res.json.calledWith({ message: 'Pet deleted' })).to.be.true;
  });

  it('should return 404 if pet not found', async () => {
    sinon.stub(Pet, 'findById').resolves(null);

    const req = { params: { id: new mongoose.Types.ObjectId().toString() } };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    await deletePet(req, res);

    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWith({ message: 'Pet not found' })).to.be.true;
  });

  it('should return 500 on error', async () => {
    sinon.stub(Pet, 'findById').throws(new Error('DB Error'));

    const req = { params: { id: new mongoose.Types.ObjectId().toString() } };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    await deletePet(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;
  });
});
