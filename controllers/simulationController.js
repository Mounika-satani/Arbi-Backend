const { Service, Dependency, Simulation } = require('../models');

exports.simulateFailure = async (req, res) => {
    const { failedServiceIds } = req.body;
    let impactedMap = {};
    let queue = failedServiceIds.map(id => ({ id, path: [id] }));

    try {
        while (queue.length > 0) {
            const { id: currentId, path: currentPath } = queue.shift();


            const downstreamDeps = await Dependency.findAll({ where: { dependsOnId: currentId } });

            for (const dep of downstreamDeps) {
                if (!impactedMap[dep.serviceId] && !failedServiceIds.includes(dep.serviceId)) {
                    const newPath = [...currentPath, dep.serviceId];
                    impactedMap[dep.serviceId] = newPath;
                    queue.push({ id: dep.serviceId, path: newPath });
                }
            }
        }

        const impactedList = Object.keys(impactedMap).map(id => ({
            serviceId: parseInt(id),
            path: impactedMap[id]
        }));


        const allFailedIds = [...failedServiceIds, ...impactedList.map(i => i.serviceId)];
        const allFailedServices = await Service.findAll({ where: { id: allFailedIds } });


        let criticalityScore = 0;
        allFailedServices.forEach(srv => {
            if (srv.criticality === 'High') criticalityScore += 3;
            else if (srv.criticality === 'Medium') criticalityScore += 2;
            else criticalityScore += 1;
        });
        const maxPossibleCriticality = allFailedIds.length * 3;
        const criticalityMultiplier = maxPossibleCriticality > 0 ? (criticalityScore / maxPossibleCriticality) : 0;


        let maxDepth = 1;
        impactedList.forEach(imp => {
            if (imp.path.length > maxDepth) {
                maxDepth = imp.path.length;
            }
        });
        const depthMultiplier = Math.min(maxDepth * 0.5, 2);


        const totalServices = await Service.count();
        const percentImpacted = totalServices > 0 ? (allFailedIds.length / totalServices) : 0;



        let severityScore = (percentImpacted * 5) + (criticalityMultiplier * 3) + depthMultiplier;
        severityScore = Math.min(Math.max(severityScore, 0), 10);

        const simulation = await Simulation.create({
            failedServiceIds,
            impactedServiceIds: impactedList,
            totalImpacted: allFailedIds.length,
            severityScore: parseFloat(severityScore.toFixed(2))
        });

        res.json(simulation);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const history = await Simulation.findAll({ order: [['createdAt', 'DESC']] });
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
