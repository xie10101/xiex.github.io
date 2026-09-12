const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const blogRoot = path.resolve(__dirname, '..')
const sourceDir = path.join(blogRoot, 'public')
const targetDir = path.resolve(
  process.env.STATIC_SITE_DIR || path.join(blogRoot, '..', 'xiezixuan.github.io')
)

if (!fs.existsSync(sourceDir)) {
  throw new Error(`Build output does not exist: ${sourceDir}`)
}

if (!fs.existsSync(path.join(targetDir, '.git'))) {
  throw new Error(`Target is not a Git repository: ${targetDir}`)
}

for (const entry of fs.readdirSync(targetDir)) {
  if (entry !== '.git') {
    fs.rmSync(path.join(targetDir, entry), { recursive: true, force: true })
  }
}

fs.cpSync(sourceDir, targetDir, { recursive: true })

const git = (args) => execFileSync('git', args, {
  cwd: targetDir,
  stdio: 'inherit'
})

git(['add', '--all'])

try {
  execFileSync('git', ['diff', '--cached', '--quiet'], {
    cwd: targetDir,
    stdio: 'ignore'
  })
  console.log('Static site is already up to date.')
} catch {
  const message = process.env.PUBLISH_MESSAGE || `deploy: ${new Date().toISOString()}`
  git(['commit', '-m', message])
  git(['push', 'origin', 'main'])
}

console.log(`Published ${sourceDir} to ${targetDir}`)
