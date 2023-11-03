/**
 *
 * @param maxVideoUsage How many times to use a certain video in combinations.
 * @param videosPerCombinationParam How many videos can appear in a combination.
 * @param filesNumber How many files to simulate
 * @returns
 */
export default function calculateAllCombinations(maxVideoUsage, videosPerCombinationParam, filesNumber) {
    const matrix = [];
    const combinations = [];
    const maxUsage = maxVideoUsage;
    const videosPerCombination = videosPerCombinationParam;
    const files = [];
    for (let x = 0; x < filesNumber; x++) {
        files.push(`file${x}`);
    }
    // Initialize the matrix
    files.forEach(file => {
        matrix.push([file, 0]);
    });
    // Generate combinations
    for (let i = 0; i < matrix.length; i++) {
        const combination = [];
        let j = i;
        while (combination.length < videosPerCombination && j < matrix.length) {
            // Check if video has not been used more than maxUsage times
            if (matrix[j][1] < maxUsage) {
                combination.push(matrix[j][0]);
                matrix[j][1] = matrix[j][1] + 1;
            }
            j++;
        }
        if (combination.length === videosPerCombination) {
            combinations.push(combination);
        }
    }
    /**
     * False is added to keep track which combinations have been made.
     * The first false array is the last one processed
     */
    combinations.forEach(combination => {
        combination.push(false);
    });
    return combinations.length;
}
