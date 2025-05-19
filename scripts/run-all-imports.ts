import { spawn } from "child_process"

const scripts = ["import-library-info.ts", "import-users.ts", "import-materials-only.ts", "import-loans.ts"]

async function runScript(scriptName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`\n========== Running ${scriptName} ==========\n`)

    const scriptPath = `./scripts/${scriptName}`
    const child = spawn("npx", ["ts-node", scriptPath], { stdio: "inherit" })

    child.on("close", (code) => {
      if (code === 0) {
        console.log(`\n✅ ${scriptName} completed successfully\n`)
        resolve()
      } else {
        console.error(`\n❌ ${scriptName} failed with code ${code}\n`)
        reject(new Error(`Script ${scriptName} failed with code ${code}`))
      }
    })

    child.on("error", (err) => {
      console.error(`\n❌ Failed to start ${scriptName}: ${err}\n`)
      reject(err)
    })
  })
}

async function main() {
  console.log("Starting complete import process...")
  console.log("This will run all import scripts in sequence")

  try {
    for (const script of scripts) {
      await runScript(script)
    }

    console.log("\n✅✅✅ All imports completed successfully! ✅✅✅")
  } catch (error) {
    console.error("\n❌❌❌ Import process failed ❌❌❌")
    console.error(error)
    process.exit(1)
  }
}

main()
