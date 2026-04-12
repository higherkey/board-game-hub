const { execSync } = require('child_process');

function run(cmd) {
    try {
        return execSync(cmd, { encoding: 'utf8', stdio: 'pipe' }).trim();
    } catch (e) {
        console.error(`Error executing: ${cmd}`);
        console.error(e.stderr);
        throw e;
    }
}

async function main() {
    // 1. Fetch current items directly
    const out = run('gh project item-list 4 --owner higherkey -L 200 --format json');
    const data = JSON.parse(out);
    const items = data.items;

    const projectId = 'PVT_kwHOAZhFqM4BQr3t'; 

    const priorityFieldId = 'PVTSSF_lAHOAZhFqM4BQr3tzg-u9kA';
    const priorityOpts = { 'P0': '79628723', 'P1': '0a877460', 'P2': 'da944a9c' };

    const sizeFieldId = 'PVTSSF_lAHOAZhFqM4BQr3tzg-u9kE';
    const sizeOpts = { 'XS': '6c6483d2', 'S': 'f784b110', 'M': '7515a9f1', 'L': '817d0097', 'XL': 'db339eb2' };
    
    const statusFieldId = 'PVTSSF_lAHOAZhFqM4BQr3tzg-u9d0';
    const closedStatusId = '3509fc7e';

    function setItemField(itemId, fieldId, optionId) {
        if (!optionId) return;
        run(`gh project item-edit --id ${itemId} --project-id ${projectId} --field-id ${fieldId} --single-select-option-id ${optionId}`);
    }

    const outOfScopeTitles = [
        "Complete Symbology", "Complete Four in a Row", "Complete Sushi Train!",
        "Complete Breaking News", "Complete Deepfake", "Complete Poppycock",
        "Complete Wisecrack", "Complete Warships", "Complete Universal Translator",
        "Complete Nom de Code", "Complete One & Only", "Complete Pictophone",
        "Work on Farkle", "Work on Spectrum", "Work on Courtship", "Work on Silent Heist",
        "Work on Foley Artist", "Work on Lost in Translation", "Work on Code Breaker",
        "Work on Yacht", "Work on Terminal"
    ];

    const resolvedIssues = [83, 85]; 

    const outOfScopeItemsToMove = [];
    
    for (const item of items) {
        let title = item.title;
        // Project items can be draft items if content is null, skip them
        if (!item.content || item.content.type !== 'Issue') continue;
        
        const number = item.content.number;
        const itemId = item.id;
        
        let targetPriority = item.priority;
        let targetSize = item.size;

        const tagsMatch = title.match(/^((?:\[[^\]]*\]\s*)+)/);
        if (tagsMatch) {
            const tags = tagsMatch[1];
            if (tags.toLowerCase().includes('[p0]')) targetPriority = 'P0';
            else if (tags.toLowerCase().includes('[p1]')) targetPriority = 'P1';
            else if (tags.toLowerCase().includes('[p2]')) targetPriority = 'P2';
            title = title.replace(/^((?:\[[^\]]*\]\s*)+)/, '').trim();
        }

        if (!targetPriority) {
            if (title.toLowerCase().includes('security') || title.toLowerCase().includes('critical')) targetPriority = 'P0';
            else if (title.toLowerCase().includes('bug:') || title.toLowerCase().includes('fix:')) targetPriority = 'P1';
            else targetPriority = 'P2';
        }

        if (!targetSize) {
            if (title.toLowerCase().includes('work on') || title.toLowerCase().includes('complete') || title.toLowerCase().includes('architecture')) targetSize = 'L';
            else if (title.toLowerCase().includes('feat:') || title.toLowerCase().includes('implement')) targetSize = 'M';
            else if (title.toLowerCase().includes('bug:') || title.toLowerCase().includes('fix:')) targetSize = 'S';
            else if (title.toLowerCase().includes('polish') || title.toLowerCase().includes('update')) targetSize = 'XS';
            else targetSize = 'M';
        }

        if (title !== item.title) {
            console.log(`Renaming issue #${number} to "${title}"`);
            run(`gh issue edit ${number} --title "${title}"`);
        }

        if (item.priority !== targetPriority) {
            console.log(`Setting Priority ${targetPriority} on item ${number}`);
            setItemField(itemId, priorityFieldId, priorityOpts[targetPriority]);
        }

        if (item.size !== targetSize) {
            console.log(`Setting Size ${targetSize} on item ${number}`);
            setItemField(itemId, sizeFieldId, sizeOpts[targetSize]);
        }

        if (resolvedIssues.includes(number)) {
            console.log(`Closing automatically resolved issue #${number}`);
            run(`gh issue close ${number} -c "Resolved in a previous PR but left open."`);
            setItemField(itemId, statusFieldId, closedStatusId);
        }

        if (outOfScopeTitles.includes(item.title) || outOfScopeTitles.includes(title)) {
            outOfScopeItemsToMove.push(item);
        }
    }

    if (outOfScopeItemsToMove.length > 0) {
        console.log(`\nFound ${outOfScopeItemsToMove.length} out-of-scope issues. Moving to new project...`);
        
        let newProjectNumber;
        const existingProjects = run(`gh project list --owner higherkey --format json`);
        const projectsData = JSON.parse(existingProjects);
        const beta2 = projectsData.projects.find(p => p.title === 'BGH Beta 0.2');
        
        if (beta2) {
            newProjectNumber = beta2.number;
        } else {
            console.log("Creating new project: BGH Beta 0.2");
            run(`gh project create --owner higherkey --title "BGH Beta 0.2"`);
            const newProjects = run(`gh project list --owner higherkey --format json`);
            const newProjectsData = JSON.parse(newProjects);
            newProjectNumber = newProjectsData.projects.find(p => p.title === 'BGH Beta 0.2').number;
        }

        for (const item of outOfScopeItemsToMove) {
            console.log(`Moving #${item.content.number} (${item.title}) to BGH Beta 0.2`);
            run(`gh project item-add ${newProjectNumber} --owner higherkey --url ${item.content.url}`);
            run(`gh project item-delete 4 --owner higherkey --id ${item.id}`);
        }
    }

    console.log("Done.");
}

main().catch(console.error);
