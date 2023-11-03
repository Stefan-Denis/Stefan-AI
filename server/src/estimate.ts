/**
 * Creates the combinations for the video.
 */
type combination = Array<subCombination>

/**
 * Represents an array that is inside the "combinations" type
 */
type subCombination = Array<string | boolean>

/**
 * Generates the combinations for the videos.
 * @returns An array of combinations.
 */
type videoDataMatrix = Array<Array<string | number>>

/**
 * 
 * @param maxVideoUsage How many times to use a certain video in combinations.
 * @param videosPerCombinationParam How many videos can appear in a combination.
 * @param filesNumber How many files to simulate
 * @returns 
 */
export default function calculateAllCombinations(maxVideoUsage: number, videosPerCombinationParam: number, filesNumber: number): number {
    const matrix: videoDataMatrix = []
    const combinations: combination = []
    const maxUsage = maxVideoUsage
    const videosPerCombination = videosPerCombinationParam

    const files: string[] = []
    for (let x = 0; x < filesNumber; x++) {
        files.push(`file${x}`)
    }

    // Initialize the matrix
    files.forEach(file => {
        matrix.push([file, 0])
    })

    // Generate combinations
    for (let i = 0; i < matrix.length; i++) {
        const combination: string[] = []
        let j = i
        while (combination.length < videosPerCombination && j < matrix.length) {
            // Check if video has not been used more than maxUsage times
            if ((matrix[j][1] as number) < maxUsage) {
                combination.push(matrix[j][0] as string)
                matrix[j][1] = (matrix[j][1] as number) + 1
            }
            j++
        }
        if (combination.length === videosPerCombination) {
            combinations.push(combination)
        }
    }

    /**
     * False is added to keep track which combinations have been made.
     * The first false array is the last one processed
     */
    combinations.forEach(combination => {
        combination.push(false)
    })

    return combinations.length
}
