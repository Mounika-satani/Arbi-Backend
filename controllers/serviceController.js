const { Service, Dependency } = require('../models');


exports.createService = async (req, res) => {
    try {
        const service = await Service.create(req.body);
        res.status(201).json(service);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const { Sequelize } = require('../models');

exports.getAllServices = async (req, res) => {
    try {
        const { search, criticality, owner } = req.query;
        const whereCondition = { [Sequelize.Op.and]: [] };


        if (search) {
            whereCondition[Sequelize.Op.and].push({
                [Sequelize.Op.or]: [
                    { name: { [Sequelize.Op.iLike]: `%${search}%` } },
                    { owner: { [Sequelize.Op.iLike]: `%${search}%` } }
                ]
            });
        }


        if (criticality) {
            whereCondition[Sequelize.Op.and].push({ criticality });
        }


        if (owner) {
            whereCondition[Sequelize.Op.and].push({
                owner: { [Sequelize.Op.iLike]: `%${owner}%` }
            });
        }

        const services = await Service.findAll({
            where: whereCondition[Sequelize.Op.and].length ? whereCondition : {},
            include: [
                { model: Dependency, as: 'outgoingDependencies' },
                { model: Dependency, as: 'incomingDependencies' }
            ]
        });
        res.json(services);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const [updated] = await Service.update(req.body, { where: { id } });
        if (updated) {
            const updatedService = await Service.findByPk(id);
            res.json(updatedService);
        } else {
            res.status(404).json({ error: 'Service not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteService = async (req, res) => {
    try {
        const { id } = req.params;
        const targetId = parseInt(id, 10);
        await Dependency.destroy({
            where: {
                [Sequelize.Op.or]: [{ serviceId: targetId }, { dependsOnId: targetId }]
            }
        });

        const deleted = await Service.destroy({ where: { id: targetId } });
        if (deleted) {
            res.status(204).json();
        } else {
            res.status(404).json({ error: 'Service not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.addDependency = async (req, res) => {
    const { serviceId, dependsOnId } = req.body;

    const src = parseInt(serviceId, 10);
    const tgt = parseInt(dependsOnId, 10);

    if (src === tgt) {
        return res.status(400).json({ error: "A service cannot depend on itself." });
    }

    try {

        const allServices = await Service.findAll({ attributes: ['id', 'name'] });
        const idToName = {};
        allServices.forEach(s => { idToName[s.id] = s.name; });


        const cyclePath = await findCyclePath(tgt, src, idToName);
        if (cyclePath) {
            return res.status(400).json({
                error: "Circular dependency detected",
                cyclePath
            });
        }

        const dependency = await Dependency.create({ serviceId: src, dependsOnId: tgt });
        res.status(201).json(dependency);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


async function findCyclePath(startNodeId, targetNodeId, idToName) {

    const { Sequelize } = require('../models');
    const allDeps = await Dependency.findAll({ attributes: ['serviceId', 'dependsOnId'] });

    const graph = {};
    allDeps.forEach(d => {
        if (!graph[d.serviceId]) graph[d.serviceId] = [];
        graph[d.serviceId].push(d.dependsOnId);
    });

    const colour = {};
    const parent = {};
    let cycleEntry = null;

    function dfs(node) {
        colour[node] = 1;
        for (const neighbour of (graph[node] || [])) {
            if (colour[neighbour] === 1 && neighbour === targetNodeId) {
                cycleEntry = neighbour;
                return true;
            }
            if (!colour[neighbour]) {
                parent[neighbour] = node;
                if (dfs(neighbour)) return true;
            }
        }
        colour[node] = 2;
        return false;
    }

    parent[startNodeId] = null;
    const found = dfs(startNodeId);

    if (!found) return null;


    const path = [];
    let cur = startNodeId;
    while (cur !== undefined && cur !== null) {
        path.unshift(cur);
        if (cur === cycleEntry && path.length > 1) break;
        cur = parent[cur];
    }
    path.push(cycleEntry);

    return path.map(id => idToName[id] || `#${id}`);
}

exports.deleteDependency = async (req, res) => {
    try {
        const { serviceId, dependsOnId } = req.params;
        const deleted = await Dependency.destroy({ where: { serviceId, dependsOnId } });
        if (deleted) {
            res.status(204).json();
        } else {
            res.status(404).json({ error: 'Dependency not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
