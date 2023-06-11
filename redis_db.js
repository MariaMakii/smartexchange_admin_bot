import { createClient } from "redis";

class Redis {
  constructor() {
    this.client = null;
    this.field1 = null;
  }

  async create() {
    this.client = createClient({
      socket: {
        host: 'localhost',
        port: 6379
      }
    });
    this.client.on("error", (err) => console.log("Redis Client Error", err));
    await this.client.connect();
    this.client.on('connect', function() {
      console.log('Connected!');
    });
  }

  

  async setWhatAdminWaiting(adminId, field) {
    await this.client.SET(`${adminId}_waiting`, field);
  }

  async getWhatAdminWaiting(adminId) {
    return await this.client.GET(`${adminId}_waiting`);
  }

  async setUserWhoBringTheBatch(adminId, userId) {
    await this.client.HSET(`${adminId}_new_batch`, "userId", userId);
  }

  async setMaterialOfTheNewBatch(adminId, materialId) {
    await this.client.HSET(`${adminId}_new_batch`, "materialId", materialId);
  }

  async getMaterialOfTheNewBatch(adminId) {
    return await this.client.HGET(`${adminId}_new_batch`, "materialId");
  }

  async setCollectionPointOfTheNewBatch(adminId, pointId) {
    await this.client.HSET(`${adminId}_new_batch`, "pointId", pointId);
  }

  async getUserIdWhoBringTheBatch() {}

  async saveResearches(researches) {
    await this.client.SET("available_researches", JSON.stringify(researches));
  }

  async getAvailableResearches() {
    const researches = await this.client.GET("available_researches");
    return researches;
  }

  async getResearchDataById(id) {
    const researches = JSON.parse(await this.getAvailableResearches());
    let data = researches.find((research) => research.id == id);
    return data;
  }

  async selectResearch(userId, researchId, title) {
    await this.client.HSET(
      `${userId}_research`,
      "researchInfo",
      JSON.stringify({ researchId: researchId, title: title })
    );
  }

  async getResearchInfo(userId) {
    const researchInfo = await this.client.HGET(
      `${userId}_research`,
      "researchInfo"
    );
    return researchInfo;
  }

  async setResearchInfo(userId, researchInfo) {
    await this.client.HSET(
      `${userId}_research`,
      "researchInfo",
      JSON.stringify(researchInfo)
    );
  }

  async setProfileInfo(userId, profileInfo) {
    await this.client.HSET(
      `${userId}_research`,
      "profileInfo",
      JSON.stringify(profileInfo)
    );
  }

  async getProfileInfo(userId) {
    const profileInfo = await this.client.HGET(
      `${userId}_research`,
      "profileInfo"
    );
    return profileInfo;
  }

  async setPartnerInfoCompatibility(userId, data) {
    await this.client.HSET(
      `${userId}_compatibility`,
      "partner",
      JSON.stringify(data)
    );
  }

  async getPartnerInfoCompatibility(userId) {
    const partner = await this.client.HGET(
      `${userId}_compatibility`,
      "partner"
    );
    return partner;
  }
}
console.log("редис посажен");
const redis = new Redis();
export { redis };
