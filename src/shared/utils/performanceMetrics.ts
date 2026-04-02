import { Project, Task, Round, Estimation, User } from '../../types';

/**
 * Calculates the participation rate of experts in a project.
 * RF012: The system tracks which experts have already estimated.
 */
export const calculateParticipationRate = (project: Project, rounds: Round[]): number => {
  if (!project.expertIds || project.expertIds.length === 0 || rounds.length === 0) return 0;
  
  const totalExperts = project.expertIds.length;
  const participationByRound = rounds.map(round => {
    if (!round.estimations) return 0;
    // Count unique experts who submitted an estimation in this round
    const participatingExperts = new Set(round.estimations.map(e => e.expertId)).size;
    return (participatingExperts / totalExperts) * 100;
  });

  if (participationByRound.length === 0) return 0;
  const averageParticipation = participationByRound.reduce((acc, curr) => acc + curr, 0) / participationByRound.length;
  
  return parseFloat(averageParticipation.toFixed(1));
};

/**
 * Calculates a consensus index based on Coefficient of Variation (CV).
 * RF020: Convergence detection via CV.
 */
export const calculateConsensusIndex = (rounds: Round[]): number => {
  if (rounds.length === 0) return 0;

  // Filter rounds that have stats and a CV
  const roundsWithCV = rounds.filter(r => r.stats && typeof r.stats.coefficientOfVariation === 'number');
  
  if (roundsWithCV.length === 0) return 0;

  // We consider a "Consensus Score" as inverse of average CV (scaled to 100)
  // Higher CV means lower consensus. CV of 0 is 100% consensus.
  // CV of 1.0 or more is 0% consensus.
  const avgCV = roundsWithCV.reduce((acc, r) => acc + (r.stats?.coefficientOfVariation || 0), 0) / roundsWithCV.length;
  
  const consensusScore = Math.max(0, Math.min(100, (1 - avgCV) * 100));
  
  return parseFloat(consensusScore.toFixed(1));
};

/**
 * Calculates average number of rounds required to reach consensus.
 */
export const calculateAverageRounds = (tasks: Task[], roundsByTask: Record<string, Round[]>): number => {
  const completedTasks = tasks.filter(t => t.status === 'consensus' || t.status === 'finalized');
  
  if (completedTasks.length === 0) return 0;

  const roundsCounts = completedTasks.map(t => {
    const taskRounds = roundsByTask[t.id] || [];
    return taskRounds.length;
  });

  const average = roundsCounts.reduce((acc, curr) => acc + curr, 0) / roundsCounts.length;
  
  return parseFloat(average.toFixed(1));
};

/**
 * Calculates an accuracy score for an expert based on how close their 
 * estimates were to the final consensus.
 * RF028: Expert performance report.
 */
export const calculateExpertAccuracy = (
  expertId: string, 
  tasks: Task[], 
  roundsByTask: Record<string, Round[]>
): number => {
  const relevantTasks = tasks.filter(t => 
    (t.status === 'consensus' || t.status === 'finalized') && 
    t.finalEstimate !== undefined
  );

  if (relevantTasks.length === 0) return 0;

  let totalDeviation = 0;
  let estimatedTasksCount = 0;

  relevantTasks.forEach(task => {
    const taskRounds = roundsByTask[task.id] || [];
    if (taskRounds.length === 0) return;

    // Get the expert's last estimation for this task
    const lastRound = taskRounds[taskRounds.length - 1];
    const expertEstimation = lastRound.estimations?.find(e => e.expertId === expertId);

    if (expertEstimation && task.finalEstimate !== undefined && task.finalEstimate !== 0) {
      // Calculate percentage deviation from final consensus
      const deviation = Math.abs(expertEstimation.value - task.finalEstimate) / task.finalEstimate;
      totalDeviation += deviation;
      estimatedTasksCount++;
    }
  });

  if (estimatedTasksCount === 0) return 0;

  // Accuracy score is 100 minus average deviation (capped at 0-100)
  const averageDeviation = totalDeviation / estimatedTasksCount;
  const accuracyScore = Math.max(0, Math.min(100, (1 - averageDeviation) * 100));

  return parseFloat(accuracyScore.toFixed(1));
};

/**
 * Gets a global summary of performance metrics for the admin panel.
 */
export const getAdminMetricsSummary = (
  projects: Project[] = [],
  tasks: Task[] = [],
  roundsByTask: Record<string, Round[]> = {}
) => {
  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeRoundsByTask = roundsByTask || {};

  const activeProjects = safeProjects.filter(p => p && !p.isDeleted);

  
  // 1. Participation Rate
  const participationRates = activeProjects
    .map(p => {
      const projectTasks = safeTasks.filter(t => t && t.projectId === p.id);
      const projectRounds = projectTasks.flatMap(t => safeRoundsByTask[t.id] || []);
      return projectRounds.length > 0 ? calculateParticipationRate(p, projectRounds) : null;
    })
    .filter((rate): rate is number => rate !== null);
  
  const avgParticipation = participationRates.length > 0
    ? participationRates.reduce((a, b) => a + b, 0) / participationRates.length
    : 0;

  // 2. Consensus Index
  const allRounds = Object.values(safeRoundsByTask).flat();
  const consensusIndex = calculateConsensusIndex(allRounds);

  // 3. Average Rounds
  const avgRounds = calculateAverageRounds(safeTasks, safeRoundsByTask);


  return {
    participationRate: parseFloat(avgParticipation.toFixed(1)),
    consensusIndex,
    avgRounds,
    activeSessions: activeProjects.filter(p => p.status === 'active' || p.status === 'kickoff').length
  };
};
