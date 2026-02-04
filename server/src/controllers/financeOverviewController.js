// import FinanceTransaction from '../models/FinanceTransaction.js';
// import MonthlyFinancialPlan from '../models/MonthlyFinancialPlan.js';
// import PeriodicFinancialPlan from '../models/PeriodicFinancialPlan.js';
// import { createErrorResponse, createSuccessResponse } from '../utils/errors.js';
// import mongoose from 'mongoose';
// import FinancePeriod from '../models/FinancePeriod.js';
// import {
//     validateDateRange
// } from '../utils/financeHelpers.js';


// export const getFinanceMetrics = async (req, res, next) => {
//     try {
//         const userId = memberId === 'all' ? null : memberId || req.user._id;

//         if (!userId || !start || !end) {
//             throw createErrorResponse(
//                 'BAD_REQUEST',
//                 'userId, start, and end are required',
//                 400
//             );
//         }

//         console.log("================", userId, start, end)

//         const startDate = new Date(start);
//         const endDate = new Date(end);

//         validateDateRange(startDate, endDate);

//         const userObjectId = new mongoose.Types.ObjectId(userId);

//         /* ======================================================
//             TRANSACTION AGGREGATION (SHARED)
//         ====================================================== */

//         const aggregateTransactions = async (from, to) => {
//             const [result] = await FinanceTransaction.aggregate([
//                 {
//                     $match: {
//                         userId: userObjectId,
//                         date: { $gte: from, $lte: to }
//                     }
//                 },
//                 {
//                     $group: {
//                         _id: null,
//                         actualIncome: {
//                             $sum: {
//                                 $cond: [
//                                     {
//                                         $and: [
//                                             { $eq: ['$type', 'income'] },
//                                             { $eq: ['$status', 'accepted'] }
//                                         ]
//                                     },
//                                     '$amount',
//                                     0
//                                 ]
//                             }
//                         },
//                         actualExpense: {
//                             $sum: {
//                                 $cond: [
//                                     {
//                                         $and: [
//                                             { $eq: ['$type', 'outcome'] },
//                                             { $eq: ['$status', 'accepted'] }
//                                         ]
//                                     },
//                                     '$amount',
//                                     0
//                                 ]
//                             }
//                         },
//                         pendingIncome: {
//                             $sum: {
//                                 $cond: [
//                                     {
//                                         $and: [
//                                             { $eq: ['$type', 'income'] },
//                                             { $eq: ['$status', 'pending'] }
//                                         ]
//                                     },
//                                     '$amount',
//                                     0
//                                 ]
//                             }
//                         },
//                         budgetedPerformance: {
//                             $sum: {
//                                 $cond: [
//                                     {
//                                         $and: [
//                                             { $eq: ['$type', 'income'] },
//                                             { $in: ['$status', ['pending', 'accepted']] }
//                                         ]
//                                     },
//                                     '$amount',
//                                     0
//                                 ]
//                             }
//                         }
//                     }
//                 }
//             ]);

//             return result ? {
//                 actualIncome: result?.actualIncome || 0,
//                 actualExpense: result?.actualExpense || 0,
//                 pendingIncome: result?.pendingIncome || 0,
//                 budgetedPerformance: result?.budgetedPerformance || 0
//             } : {
//                 actualIncome: 0,
//                 actualExpense: 0,
//                 pendingIncome: 0,
//                 budgetedPerformance: 0
//             };
//         };

//         const monthKey = startDate.toISOString().slice(0, 7); // YYYY-MM

//         /* ======================================================
//             WEEKLY METRICS
//         ====================================================== */

//         const periods = await FinancePeriod.find({
//             month: monthKey
//         }).lean();
//         console.log("=============periods=============", periods)
//         const periodIds = periods.map(p => p._id);
//         console.log("=============periodIds=============", periodIds)

//         const weeklyPlans = await PeriodicFinancialPlan.find({
//             userId: userObjectId,
//             periodId: { $in: periodIds }
//         })
//             .populate('periodId') // IMPORTANT
//             .lean();

//         const weeklyMetrics = [];

//         for (const plan of weeklyPlans) {
//             const tx = await aggregateTransactions(plan.periodId.startDate, plan.periodId.endDate);

//             weeklyMetrics.push({
//                 target: plan.periodicFinancialGoal,
//                 period: plan.periodId.definition,
//                 ...tx,
//                 gap: plan.periodicFinancialGoal - tx.actualIncome
//             });
//         }
//         // const monthlyTransactions = await FinanceTransaction.find({
//         //     userId: userObjectId,
//         //     date: { $gte: startDate, $lte: endDate }
//         //   }).lean();
//         //   const calculateMetricsFromTransactions = (transactions) => {
//         //     let actualIncome = 0;
//         //     let actualExpense = 0;
//         //     let pendingIncome = 0;
//         //     let budgetedPerformance = 0;

//         //     for (const tx of transactions) {
//         //       if (tx.type === 'income') {
//         //         if (tx.status === 'accepted') {
//         //           actualIncome += tx.amount;
//         //           budgetedPerformance += tx.amount;
//         //         } else if (tx.status === 'pending') {
//         //           pendingIncome += tx.amount;
//         //           budgetedPerformance += tx.amount;
//         //         }
//         //       }

//         //       if (tx.type === 'outcome' && tx.status === 'accepted') {
//         //         actualExpense += tx.amount;
//         //       }
//         //     }

//         //     return {
//         //       actualIncome,
//         //       actualExpense,
//         //       pendingIncome,
//         //       budgetedPerformance
//         //     };
//         //   };
//         // const weeklyMetrics = weeklyPlans.map(plan => {
//         //     const { startDate, endDate } = plan.periodId;

//         //     const txs = monthlyTransactions.filter(
//         //       t => t.date >= startDate && t.date <= endDate
//         //     );

//         //     const metrics = calculateMetricsFromTransactions(txs);

//         //     return {
//         //       period: plan.periodId.definition,
//         //       target: plan.periodicFinancialGoal,
//         //       ...metrics,
//         //       gap: plan.periodicFinancialGoal - metrics.actualIncome
//         //     };
//         //   });

//         console.log("=============weeklyPlans=============", weeklyPlans)

//         /* ======================================================
//             MONTHLY METRICS
//         ====================================================== */

//         const monthlyPlan = await MonthlyFinancialPlan.findOne({
//             userId: userObjectId,
//             month: monthKey
//         }).lean();

//         const monthlyTx = await aggregateTransactions(startDate, endDate);

//         const monthlyTarget = monthlyPlan?.monthlyFinancialGoal || 0;

//         const monthlyMetrics = {
//             ...monthlyTx,
//             target: monthlyTarget,
//             gap: monthlyTarget - monthlyTx.actualIncome
//         };

//         /* ======================================================
//             YEARLY METRICS
//         ====================================================== */

//         const year = startDate.getUTCFullYear();
//         const yearStart = new Date(`${year}-01-01T00:00:00.000Z`);
//         const yearEnd = new Date(`${year}-12-31T23:59:59.999Z`);

//         const yearlyTx = await aggregateTransactions(yearStart, yearEnd);

//         const yearlyPlans = await MonthlyFinancialPlan.find({
//             userId: userObjectId,
//             month: { $regex: `^${year}` }
//         }).lean();

//         const yearlyTarget = yearlyPlans.reduce(
//             (sum, p) => sum + (p.monthlyFinancialGoal || 0),
//             0
//         );

//         const yearlyMetrics = {
//             ...yearlyTx,
//             target: yearlyTarget,
//             gap: yearlyTarget - yearlyTx.actualIncome
//         };

//         /* ======================================================
//             RESPONSE
//         ====================================================== */

//         console.log("=============yearlyMetrics=============", yearlyMetrics)
//         console.log("=============monthlyMetrics=============", monthlyMetrics)
//         console.log("=============weeklyMetrics=============", weeklyMetrics)

//         return res.json(createSuccessResponse({
//             metrics: {
//                 year: yearlyMetrics,
//                 month: monthlyMetrics,
//                 week: weeklyMetrics
//             }
//         }));
//         res.json(
//             createSuccessResponse({
//                 metrics: {
//                     year: yearlyMetrics,
//                     month: monthlyMetrics,
//                     week: weeklyMetrics
//                 }
//             })
//         );
//     } catch (err) {
//         next(err);
//     }
// };


import FinanceTransaction from '../models/FinanceTransaction.js';
import MonthlyFinancialPlan from '../models/MonthlyFinancialPlan.js';
import PeriodicFinancialPlan from '../models/PeriodicFinancialPlan.js';
import FinancePeriod from '../models/FinancePeriod.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { createErrorResponse, createSuccessResponse } from '../utils/errors.js';
import { validateDateRange } from '../utils/financeHelpers.js';

/* ======================================================
   HELPERS
====================================================== */

const calculateMetrics = (txs) => {
  let actualIncome = 0;
  let actualExpense = 0;
  let pendingIncome = 0;
  let budgetedPerformance = 0;

  for (const tx of txs) {
    if (tx.type === 'income') {
      if (tx.status === 'accepted') {
        actualIncome += tx.amount;
        budgetedPerformance += tx.amount;
      } else if (tx.status === 'pending') {
        pendingIncome += tx.amount;
        budgetedPerformance += tx.amount;
      }
    }

    if (tx.type === 'outcome' && tx.status === 'accepted') {
      actualExpense += tx.amount;
    }
  }

  return {
    actualIncome,
    actualExpense,
    pendingIncome,
    budgetedPerformance
  };
};

const filterByRange = (txs, start, end) =>
  txs.filter(t => t.date >= start && t.date <= end);

const buildFullByUserArray = (users, byUserObj) =>
  users.map(u => {
    const metrics = byUserObj[u._id.toString()] || {
      actualIncome: 0,
      actualExpense: 0,
      pendingIncome: 0,
      budgetedPerformance: 0,
      target: 0,
      gap: 0
    };

    return {
      user: u,
      ...metrics
    };
  });

/* ======================================================
   CONTROLLER
====================================================== */

export const getFinanceMetrics = async (req, res, next) => {
  try {
    const { memberId, start, end } = req.query;
    const isAllMembers = memberId === 'all';

    if (!start || !end) {
      throw createErrorResponse(
        'BAD_REQUEST',
        'start and end are required',
        400
      );
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    validateDateRange(startDate, endDate);

    let userObjectId = null;
    if (!isAllMembers) {
      const resolvedUserId = memberId || req.user?._id;
      if (!resolvedUserId) {
        throw createErrorResponse(
          'UNAUTHORIZED',
          'User authentication required',
          401
        );
      }
      userObjectId = new mongoose.Types.ObjectId(resolvedUserId);
    }

    const monthKey = startDate.toISOString().slice(0, 7);
    const year = startDate.getUTCFullYear();
    const yearStart = new Date(`${year}-01-01T00:00:00.000Z`);
    const yearEnd = new Date(`${year}-12-31T23:59:59.999Z`);

    /* ======================================================
       LOAD USERS (SOURCE OF TRUTH)
    ====================================================== */

    const users = await User.find(
      isAllMembers ? {} : { _id: userObjectId }
    )
      .select('_id name email')
      .lean();

    /* ======================================================
       LOAD TRANSACTIONS (ONCE)
    ====================================================== */

    const txQuery = {
      date: { $gte: yearStart, $lte: yearEnd }
    };
    if (!isAllMembers) {
      txQuery.userId = userObjectId;
    }

    const allTransactions = await FinanceTransaction.find(txQuery).lean();

    /* ======================================================
       GROUP TRANSACTIONS BY USER
    ====================================================== */

    const txByUser = {};
    for (const tx of allTransactions) {
      const uid = tx.userId.toString();
      if (!txByUser[uid]) txByUser[uid] = [];
      txByUser[uid].push(tx);
    }

    /* ======================================================
       YEAR METRICS
    ====================================================== */

    const yearlyPlans = await MonthlyFinancialPlan.find(
      isAllMembers
        ? { month: { $regex: `^${year}` } }
        : { userId: userObjectId, month: { $regex: `^${year}` } }
    ).lean();

    const yearlyTargetByUser = {};
    for (const p of yearlyPlans) {
      const uid = p.userId.toString();
      yearlyTargetByUser[uid] =
        (yearlyTargetByUser[uid] || 0) + (p.monthlyFinancialGoal || 0);
    }

    const yearlyByUser = {};
    let yearlyTotal = {
      actualIncome: 0,
      actualExpense: 0,
      pendingIncome: 0,
      budgetedPerformance: 0,
      target: 0
    };

    for (const u of users) {
      const uid = u._id.toString();
      const metrics = calculateMetrics(txByUser[uid] || []);
      const target = yearlyTargetByUser[uid] || 0;

      yearlyByUser[uid] = {
        ...metrics,
        target,
        gap: target - metrics.actualIncome
      };

      yearlyTotal.actualIncome += metrics.actualIncome;
      yearlyTotal.actualExpense += metrics.actualExpense;
      yearlyTotal.pendingIncome += metrics.pendingIncome;
      yearlyTotal.budgetedPerformance += metrics.budgetedPerformance;
      yearlyTotal.target += target;
    }

    /* ======================================================
       MONTH METRICS
    ====================================================== */

    const monthlyPlans = await MonthlyFinancialPlan.find(
      isAllMembers
        ? { month: monthKey }
        : { userId: userObjectId, month: monthKey }
    ).lean();

    const monthlyTargetByUser = {};
    for (const p of monthlyPlans) {
      const uid = p.userId.toString();
      monthlyTargetByUser[uid] =
        (monthlyTargetByUser[uid] || 0) + (p.monthlyFinancialGoal || 0);
    }

    const monthlyByUser = {};
    let monthlyTotal = {
      actualIncome: 0,
      actualExpense: 0,
      pendingIncome: 0,
      budgetedPerformance: 0,
      target: 0
    };

    for (const u of users) {
      const uid = u._id.toString();
      const txs = filterByRange(txByUser[uid] || [], startDate, endDate);
      const metrics = calculateMetrics(txs);
      const target = monthlyTargetByUser[uid] || 0;

      monthlyByUser[uid] = {
        ...metrics,
        target,
        gap: target - metrics.actualIncome
      };

      monthlyTotal.actualIncome += metrics.actualIncome;
      monthlyTotal.actualExpense += metrics.actualExpense;
      monthlyTotal.pendingIncome += metrics.pendingIncome;
      monthlyTotal.budgetedPerformance += metrics.budgetedPerformance;
      monthlyTotal.target += target;
    }

    /* ======================================================
       WEEK METRICS
    ====================================================== */

    const periods = await FinancePeriod.find({ month: monthKey }).sort({ createdAt: -1 }).lean();
    const periodIds = periods.map(p => p._id);

    const weeklyPlans = await PeriodicFinancialPlan.find(
      isAllMembers
        ? { periodId: { $in: periodIds } }
        : { userId: userObjectId, periodId: { $in: periodIds } }
    )
      .populate('periodId')
      .lean();

    const weeklyMetrics = periods.map(period => {
      const byUser = {};
      let total = {
        actualIncome: 0,
        actualExpense: 0,
        pendingIncome: 0,
        budgetedPerformance: 0,
        target: 0
      };

      for (const u of users) {
        const uid = u._id.toString();
        const plan = weeklyPlans.find(
          p =>
            p.userId.toString() === uid &&
            p.periodId._id.toString() === period._id.toString()
        );

        const txs = filterByRange(
          txByUser[uid] || [],
          period.startDate,
          period.endDate
        );

        const metrics = calculateMetrics(txs);
        const target = plan?.periodicFinancialGoal || 0;

        byUser[uid] = {
          ...metrics,
          target,
          gap: target - metrics.actualIncome
        };

        total.actualIncome += metrics.actualIncome;
        total.actualExpense += metrics.actualExpense;
        total.pendingIncome += metrics.pendingIncome;
        total.budgetedPerformance += metrics.budgetedPerformance;
        total.target += target;
      }

      return {
        period: period.definition,
        total: {
          ...total,
          gap: total.target - total.actualIncome
        },
        byUser: buildFullByUserArray(users, byUser)
      };
    });

    /* ======================================================
       RESPONSE
    ====================================================== */

    return res.json(
      createSuccessResponse({
        metrics: {
          year: {
            total: {
              ...yearlyTotal,
              gap: yearlyTotal.target - yearlyTotal.actualIncome
            },
            byUser: buildFullByUserArray(users, yearlyByUser)
          },
          month: {
            total: {
              ...monthlyTotal,
              gap: monthlyTotal.target - monthlyTotal.actualIncome
            },
            byUser: buildFullByUserArray(users, monthlyByUser)
          },
          week: weeklyMetrics
        }
      })
    );
  } catch (err) {
    next(err);
  }
};
